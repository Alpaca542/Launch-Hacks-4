/**
 * Cached board service - wraps the original board service with intelligent caching
 * Reduces Firestore reads while maintaining data consistency
 */

import { cacheService } from "./cacheService";
import {
    fetchAllBoards as originalFetchAllBoards,
    fetchNodesFromBoard as originalFetchNodesFromBoard,
    fetchEdgesFromBoard as originalFetchEdgesFromBoard,
    saveNodesToBoard as originalSaveNodesToBoard,
    saveEdgesToBoard as originalSaveEdgesToBoard,
    createBoard as originalCreateBoard,
    deleteBoard as originalDeleteBoard,
    updateBoardStatus as originalUpdateBoardStatus,
    BoardData,
    NodeData,
    EdgeData,
} from "./boardService";

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
    BOARDS: 10 * 60 * 1000, // 10 minutes for boards list
    NODES: 15 * 60 * 1000, // 15 minutes for nodes (less frequently changed)
    EDGES: 15 * 60 * 1000, // 15 minutes for edges
    USER_SESSION: 30 * 60 * 1000, // 30 minutes for user session data
};

/**
 * Fetch all boards for a user with caching
 */
export const fetchAllBoards = async (userId: string): Promise<BoardData[]> => {
    return cacheService.get(
        "boards",
        userId,
        () => originalFetchAllBoards(userId),
        CACHE_TTL.BOARDS
    );
};

/**
 * Fetch nodes from a board with caching
 */
export const fetchNodesFromBoard = async (
    boardId: string
): Promise<NodeData[]> => {
    return cacheService.get(
        "nodes",
        boardId,
        () => originalFetchNodesFromBoard(boardId),
        CACHE_TTL.NODES
    );
};

/**
 * Fetch edges from a board with caching
 */
export const fetchEdgesFromBoard = async (
    boardId: string
): Promise<EdgeData[]> => {
    return cacheService.get(
        "edges",
        boardId,
        () => originalFetchEdgesFromBoard(boardId),
        CACHE_TTL.EDGES
    );
};

/**
 * Batch fetch nodes and edges for a board (more efficient)
 */
export const fetchBoardContent = async (
    boardId: string
): Promise<{
    nodes: NodeData[];
    edges: EdgeData[];
}> => {
    // Use Promise.all for parallel fetching from cache or Firestore
    const [nodes, edges] = await Promise.all([
        fetchNodesFromBoard(boardId),
        fetchEdgesFromBoard(boardId),
    ]);

    return { nodes, edges };
};

/**
 * Save nodes to board and update cache
 */
export const saveNodesToBoard = async (
    boardId: string,
    nodesToSave: NodeData[]
): Promise<void> => {
    await originalSaveNodesToBoard(boardId, nodesToSave);

    // Update cache with new data (even if empty array)
    cacheService.set("nodes", boardId, nodesToSave || [], CACHE_TTL.NODES);
};

/**
 * Save edges to board and update cache
 */
export const saveEdgesToBoard = async (
    boardId: string,
    edgesToSave: EdgeData[]
): Promise<void> => {
    await originalSaveEdgesToBoard(boardId, edgesToSave);

    // Update cache with new data (even if empty array)
    cacheService.set("edges", boardId, edgesToSave || [], CACHE_TTL.EDGES);
};

/**
 * Batch save both nodes and edges (more efficient)
 */
export const saveBoardContent = async (
    boardId: string,
    nodes: NodeData[],
    edges: EdgeData[]
): Promise<void> => {
    console.log(`Saving board content for ${boardId}:`, {
        nodeCount: (nodes || []).length,
        edgeCount: (edges || []).length,
    });

    // Save both in parallel
    await Promise.all([
        saveNodesToBoard(boardId, nodes || []),
        saveEdgesToBoard(boardId, edges || []),
    ]);
};

/**
 * Create a new board and update cache
 */
export const createBoard = async (
    userId: string,
    boardName?: string | null,
    existingBoards?: BoardData[]
): Promise<BoardData | null> => {
    const newBoard = await originalCreateBoard(
        userId,
        boardName ?? null,
        existingBoards ?? []
    );

    if (newBoard) {
        // Invalidate user's boards cache to force refresh
        cacheService.invalidate("boards", userId);

        // Pre-cache empty nodes and edges for new board
        cacheService.set("nodes", newBoard.id, [], CACHE_TTL.NODES);
        cacheService.set("edges", newBoard.id, [], CACHE_TTL.EDGES);
    }

    return newBoard;
};

/**
 * Delete a board and clean up cache
 */
export const deleteBoard = async (boardId: string): Promise<void> => {
    await originalDeleteBoard(boardId);

    // Clean up all cache entries for this board
    cacheService.invalidate("nodes", boardId);
    cacheService.invalidate("edges", boardId);

    // Note: We don't invalidate the user's boards cache here because
    // the useBoardManagement hook will handle the UI update
};

/**
 * Update board status and refresh relevant cache
 */
export const updateBoardStatus = async (
    boardId: string,
    boardData: Partial<BoardData>
): Promise<void> => {
    await originalUpdateBoardStatus(boardId, boardData);

    // If this board belongs to a user, invalidate their boards cache
    if (boardData.userId) {
        cacheService.invalidate("boards", boardData.userId);
    }
};

/**
 * Preload user data for better performance
 */
export const preloadUserData = async (userId: string): Promise<void> => {
    try {
        // Preload user's boards
        const boards = await fetchAllBoards(userId);

        // Preload content for the open board
        const openBoard = boards.find((board) => board.isOpen);
        if (openBoard) {
            // Preload in background without blocking
            fetchBoardContent(openBoard.id).catch((error) => {
                console.warn("Failed to preload board content:", error);
            });
        }

        console.log(`Preloaded data for user ${userId}`);
    } catch (error) {
        console.warn("Error in preloadUserData:", error);
    }
};

/**
 * Clear all cached data for a user (useful on logout)
 */
export const clearUserCache = (userId: string): void => {
    cacheService.invalidate("boards", userId);
    // Note: Board-specific caches (nodes, edges) will be cleaned up naturally
};

/**
 * Force refresh all data for a user
 */
export const forceRefreshUserData = async (
    userId: string
): Promise<{
    boards: BoardData[];
    openBoardContent?: { nodes: NodeData[]; edges: EdgeData[] };
}> => {
    // Clear all cached data
    clearUserCache(userId);

    // Fetch fresh data
    const boards = await fetchAllBoards(userId);

    let openBoardContent;
    const openBoard = boards.find((board) => board.isOpen);
    if (openBoard) {
        // Clear board-specific cache first
        cacheService.invalidate("nodes", openBoard.id);
        cacheService.invalidate("edges", openBoard.id);

        openBoardContent = await fetchBoardContent(openBoard.id);
    }

    return { boards, openBoardContent };
};

// Re-export types and constants that don't need caching
export {
    type BoardData,
    type NodeData,
    type EdgeData,
    initialNodes,
    initialEdges,
} from "./boardService";

// Export cache service for direct access if needed
export { cacheService } from "./cacheService";
