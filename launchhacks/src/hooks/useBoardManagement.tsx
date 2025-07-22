import { useState, useEffect, useCallback, useRef } from "react";
import {
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    useReactFlow,
} from "reactflow";
import { User } from "firebase/auth";

import {
    fetchAllBoards,
    fetchBoardContent,
    saveBoardContent,
    createBoard,
    deleteBoard as deleteBoardService,
    updateBoardStatus,
    preloadUserData,
    clearUserCache,
    forceRefreshUserData,
    initialNodes,
    initialEdges,
    BoardData,
    cacheService,
} from "../services/cachedBoardService";
import { UseNotificationsReturn } from "./useNotifications";

// Type definitions
export interface UseBoardManagementReturn {
    nodes: Node[];
    edges: Edge[];
    allBoards: BoardData[];
    currentBoard: BoardData | null;
    isLoading: boolean;
    isSwitchingBoard: boolean;
    isSaving: boolean;
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
    switchToBoard: (boardId: string) => Promise<void>;
    createNewBoard: (boardName?: string) => Promise<BoardData | null>;
    deleteBoard: (boardId: string) => Promise<void>;
    updateBoardName: (name: string) => Promise<void>;
    clearBoardState: () => void;
    saveNewNodeContent: () => Promise<void>;
    forceRefresh: () => Promise<void>;
    getCacheStats: () => any;
}

export const useBoardManagement = (
    user: User | null,
    notifications: Partial<UseNotificationsReturn> = {}
): UseBoardManagementReturn => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSwitchingBoard, setIsSwitchingBoard] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [allBoards, setAllBoards] = useState<BoardData[]>([]);
    const [currentBoard, setCurrentBoard] = useState<BoardData | null>(null);

    // Track if initial load is complete to prevent duplicate API calls
    const hasInitiallyLoaded = useRef(false);
    // Debounce saving to prevent excessive API calls
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { setViewport } = useReactFlow();

    const { showSuccess, showError, showInfo } = notifications;

    // Helper function to get open board
    const getOpenBoard = (boards: BoardData[]): BoardData | null => {
        const openBoard = boards.find((board) => board.isOpen === true);
        if (openBoard) {
            return openBoard;
        }

        // If no board is marked as open, mark the first one as open
        if (boards.length > 0) {
            const firstBoard = { ...boards[0], isOpen: true };
            // Update the board in Firestore but don't wait for it
            updateBoardStatus(firstBoard.id, firstBoard).catch(console.error);
            return firstBoard;
        }

        return null;
    };

    // Load initial data when user is authenticated
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user || hasInitiallyLoaded.current) return;

            try {
                setIsLoading(true);
                hasInitiallyLoaded.current = true;

                // Preload user data for better performance
                await preloadUserData(user.uid);

                // Fetch all user's boards (this will use cache if available)
                const boards = await fetchAllBoards(user.uid);
                setAllBoards(boards);

                // Check if we got a fallback board due to index error
                const hasFallbackBoard = boards.some(
                    (board) => board.isFallback
                );
                if (hasFallbackBoard && showError) {
                    showError(
                        "Database index missing. Please create the required Firestore index. Check console for details."
                    );
                }

                // Get the open board
                const openBoard = getOpenBoard(boards);
                if (!openBoard) {
                    console.error("No board found for user");
                    if (showError) {
                        showError(
                            "No boards found. Creating a default board..."
                        );
                    }
                    setNodes(initialNodes);
                    setEdges(initialEdges as Edge[]);
                    return;
                }

                setCurrentBoard(openBoard);

                // Fetch nodes and edges from the open board using optimized batch fetch
                const { nodes: nodesData, edges: edgesData } =
                    await fetchBoardContent(openBoard.id);

                setNodes(nodesData);
                setEdges(edgesData as Edge[]);

                if (showInfo && !hasFallbackBoard) {
                    const cacheStats = cacheService.getStats();
                    showInfo(
                        `Board loaded successfully! Cache hit rate: ${cacheStats.hitRate.toFixed(
                            1
                        )}%`
                    );
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
                hasInitiallyLoaded.current = false; // Reset on error
                if (showError) {
                    showError(
                        "Failed to load board data. Using default board."
                    );
                }
                setNodes(initialNodes);
                setEdges(initialEdges as Edge[]);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [user]);

    // Optimized save function with debouncing to prevent excessive API calls
    const saveNewNodeContent = useCallback(async () => {
        if (
            !currentBoard ||
            currentBoard.isFallback ||
            isLoading ||
            isSwitchingBoard
        ) {
            return;
        }

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce saves by 2 seconds
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                setIsSaving(true);

                // Use batch save for better performance
                if (
                    (nodes && nodes.length > 0) ||
                    (edges && edges.length > 0)
                ) {
                    await saveBoardContent(
                        currentBoard.id,
                        (nodes as any) || [],
                        (edges as any) || []
                    );
                    console.log(
                        "Batch save completed successfully after node creation"
                    );
                }
            } catch (error) {
                console.error("Save failed:", error);
                if (showError) {
                    showError("Failed to save new content");
                }
            } finally {
                setIsSaving(false);
                saveTimeoutRef.current = null;
            }
        }, 2000);
    }, [currentBoard, isLoading, isSwitchingBoard, nodes, edges, showError]);

    // Switch to board
    const switchToBoard = async (boardId: string) => {
        try {
            // Don't switch to the same board
            if (currentBoard?.id === boardId) {
                return;
            }

            // Don't switch if fallback board
            if (
                currentBoard?.isFallback ||
                allBoards.find((b) => b.id === boardId)?.isFallback
            ) {
                if (showError) {
                    showError(
                        "Cannot switch to fallback board. Please create the missing Firestore index first."
                    );
                }
                return;
            }

            setIsSwitchingBoard(true);

            // Close current board
            if (currentBoard && !currentBoard.isFallback) {
                const closedBoard = { ...currentBoard, isOpen: false };
                await updateBoardStatus(currentBoard.id, closedBoard);

                // Update in allBoards array
                setAllBoards((prevBoards) =>
                    prevBoards.map((board) =>
                        board.id === currentBoard.id ? closedBoard : board
                    )
                );
            }

            // Open new board
            const boardToOpen = allBoards.find((board) => board.id === boardId);
            if (boardToOpen) {
                const openedBoard = { ...boardToOpen, isOpen: true };
                await updateBoardStatus(boardId, openedBoard);

                setCurrentBoard(openedBoard);

                // Update in allBoards array
                setAllBoards((prevBoards) =>
                    prevBoards.map((board) =>
                        board.id === boardId ? openedBoard : board
                    )
                );

                // Load nodes and edges for the new board using optimized batch fetch
                const { nodes: nodesData, edges: edgesData } =
                    await fetchBoardContent(boardId);

                setNodes(nodesData);
                setEdges(edgesData as Edge[]);
                // Navigate to previous node
                // setViewport(
                //     {
                //         x: 0,
                //         y: 0,
                //         zoom: 1,
                //     },
                //     { duration: 200 }
                // );
                if (showSuccess) {
                    showSuccess(`Switched to "${openedBoard.name}"`);
                }
            } else {
                console.error("Board not found:", boardId);
                if (showError) {
                    showError("Board not found");
                }
            }
        } catch (error) {
            console.error("Error switching board:", error);
            if (showError) {
                showError("Failed to switch board. Please try again.");
            }
        } finally {
            setIsSwitchingBoard(false);
        }
    };

    // Create new board
    const createNewBoard = async (
        boardName?: string
    ): Promise<BoardData | null> => {
        try {
            if (!user) {
                if (showError) {
                    showError("You must be logged in to create a board");
                }
                return null;
            }

            if (showInfo) {
                showInfo("Creating new board...");
            }

            const newBoard = await createBoard(
                user.uid,
                boardName || null,
                allBoards
            );
            if (newBoard) {
                // First, close the current board if any
                if (currentBoard && !currentBoard.isFallback) {
                    const closedBoard = { ...currentBoard, isOpen: false };
                    updateBoardStatus(currentBoard.id, closedBoard).catch(
                        console.error
                    );
                }

                // Mark the new board as open
                const openNewBoard = { ...newBoard, isOpen: true };

                // Update local state with the new board
                setAllBoards((prevBoards) => {
                    const updatedBoards = prevBoards.map((board) =>
                        board.id === currentBoard?.id
                            ? { ...board, isOpen: false }
                            : board
                    );
                    return [openNewBoard, ...updatedBoards];
                });

                // Set as current board
                setCurrentBoard(openNewBoard);

                // Update in Firestore
                updateBoardStatus(newBoard.id, openNewBoard).catch(
                    console.error
                );

                // Load initial nodes and edges for the new board
                setNodes([
                    {
                        id: "1",
                        type: "staticEditable",
                        data: {
                            label: boardName || "New Board",
                        },
                        position: { x: 0, y: 0 },
                        draggable: false,
                    },
                ]);

                setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
                setEdges(initialEdges as Edge[]);

                if (showSuccess) {
                    showSuccess(`Board "${newBoard.name}" created and opened!`);
                }

                return openNewBoard;
            } else {
                if (showError) {
                    showError("Failed to create board. Please try again.");
                }
                return null;
            }
        } catch (error: any) {
            if (showError) {
                showError(`Failed to create board: ${error.message}`);
            }
            return null;
        }
    };

    // Delete board
    const deleteBoard = async (boardId: string) => {
        try {
            if (allBoards.length <= 1) {
                if (showError) {
                    showError("Cannot delete the last board!");
                }
                return;
            }

            const boardToDelete = allBoards.find(
                (board) => board.id === boardId
            );
            if (!boardToDelete) {
                console.error("Board not found for deletion");
                if (showError) {
                    showError("Board not found");
                }
                return;
            }

            if (showInfo) {
                showInfo("Deleting board...");
            }

            // If we're deleting the current board, switch to another one first
            if (currentBoard?.id === boardId) {
                const otherBoard = allBoards.find(
                    (board) => board.id !== boardId
                );
                if (otherBoard) {
                    await switchToBoard(otherBoard.id);
                }
            }

            // Delete the board
            await deleteBoardService(boardId);

            // Remove from local state
            setAllBoards((prevBoards) =>
                prevBoards.filter((board) => board.id !== boardId)
            );

            if (showSuccess) {
                showSuccess("Board deleted successfully!");
            }
        } catch (error) {
            console.error("Error deleting board:", error);
            if (showError) {
                showError("Failed to delete board. Please try again.");
            }
        }
    };

    // Update board name
    const updateBoardName = async (name: string) => {
        if (currentBoard && currentBoard.name !== name) {
            const updatedBoard = {
                ...currentBoard,
                name: name,
            };

            setCurrentBoard(updatedBoard);

            // Update in allBoards array
            setAllBoards((prevBoards) =>
                prevBoards.map((board) =>
                    board.id === currentBoard.id ? updatedBoard : board
                )
            );

            try {
                await updateBoardStatus(currentBoard.id, updatedBoard);
                console.log("Board name updated successfully");
            } catch (error) {
                console.error("Error updating board name:", error);
            }
        }
    };

    // Clear all state (for sign out) and cache
    const clearBoardState = useCallback(() => {
        if (user?.uid) {
            clearUserCache(user.uid);
        }
        setAllBoards([]);
        setCurrentBoard(null);
        setNodes([]);
        setEdges([]);
        setIsLoading(true);
        setIsSwitchingBoard(false);
        setIsSaving(false);
        hasInitiallyLoaded.current = false;

        // Clear any pending save timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
    }, [user?.uid]);

    // Force refresh all data from Firestore
    const forceRefresh = useCallback(async () => {
        if (!user?.uid) return;

        try {
            setIsLoading(true);
            if (showInfo) {
                showInfo("Refreshing data...");
            }

            const { boards, openBoardContent } = await forceRefreshUserData(
                user.uid
            );

            setAllBoards(boards);
            const openBoard = boards.find((board) => board.isOpen);
            setCurrentBoard(openBoard || null);

            if (openBoardContent) {
                setNodes(openBoardContent.nodes);
                setEdges(openBoardContent.edges as Edge[]);
            } else if (openBoard) {
                // Fallback if no open board content returned
                const { nodes: nodesData, edges: edgesData } =
                    await fetchBoardContent(openBoard.id);
                setNodes(nodesData);
                setEdges(edgesData as Edge[]);
            }

            const cacheStats = cacheService.getStats();
            if (showSuccess) {
                showSuccess(
                    `Data refreshed! Cache hit rate: ${cacheStats.hitRate.toFixed(
                        1
                    )}%`
                );
            }
        } catch (error) {
            console.error("Error during force refresh:", error);
            if (showError) {
                showError("Failed to refresh data");
            }
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid, showInfo, showSuccess, showError]);

    // Get cache statistics for debugging
    const getCacheStats = useCallback(() => {
        return cacheService.getStats();
    }, []);

    return {
        // State
        nodes,
        edges,
        allBoards,
        currentBoard,
        isLoading,
        isSwitchingBoard,
        isSaving,

        // Actions
        onNodesChange,
        onEdgesChange,
        setNodes,
        setEdges,
        switchToBoard,
        createNewBoard,
        deleteBoard,
        updateBoardName,
        clearBoardState,
        saveNewNodeContent,
        forceRefresh,
        getCacheStats,
    };
};
