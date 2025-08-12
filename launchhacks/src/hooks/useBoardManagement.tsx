import { useState, useEffect, useCallback, useRef } from "react";
import { useNodesState, useEdgesState, Node, Edge } from "reactflow";
import {
    initialNodes,
    initialEdges,
    fetchAllBoards,
    fetchNodesFromBoard,
    fetchEdgesFromBoard,
    saveNodesToBoard,
    saveEdgesToBoard,
    createBoard as svcCreateBoard,
    deleteBoard as svcDeleteBoard,
    updateBoardStatus,
    BoardData,
} from "../services/boardService";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../utils/constants";

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
    performPeriodicSave: () => Promise<void>;
    forceRefreshBoards: () => Promise<void>;
    getLastTwoLayouts: () => number[];
    addLayout: (layout: number) => void;
}

export interface UseBoardManagementInput {
    showSuccess?: (m: string) => any;
    showError?: (m: string) => any;
    showInfo?: (m: string) => any;
}

export const useBoardManagement = (
    user: { id?: string } | null,
    { showSuccess, showError }: UseBoardManagementInput = {}
): UseBoardManagementReturn => {
    const [nodes, _setNodes, onNodesChange] = useNodesState(
        initialNodes as unknown as Node[]
    );
    const [edges, _setEdges, onEdgesChange] = useEdgesState(
        initialEdges as unknown as Edge[]
    );
    const [allBoards, setAllBoards] = useState<BoardData[]>([]);
    const [currentBoard, setCurrentBoard] = useState<BoardData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSwitchingBoard, setIsSwitchingBoard] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const lastLayoutsRef = useRef<number[]>([]);

    // Track if initial load is complete to prevent duplicate API calls
    const hasInitiallyLoaded = useRef(false);
    // Track changes for individual saves
    const pendingNodeChanges = useRef<Set<string>>(new Set());
    const pendingEdgeChanges = useRef<Set<string>>(new Set());
    // Debounce individual saves
    const individualSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to get open board
    const getOpenBoard = (boards: BoardData[]): BoardData | null => {
        const openBoard = boards.find((board) => board.isOpen === true);
        if (openBoard) {
            return openBoard;
        }

        // If no board is marked as open, mark the first one as open
        if (boards.length > 0) {
            const firstBoard = { ...boards[0], isOpen: true };
            // Update the board in database but don't wait for it
            updateBoardStatus(firstBoard.id, firstBoard).catch(console.error);
            return firstBoard;
        }

        return null;
    };

    // Individual save function for immediate saves after changes - optimized with batching
    const saveIndividualChanges = useCallback(async () => {
        if (
            !currentBoard ||
            currentBoard.isFallback ||
            isLoading ||
            isSwitchingBoard
        ) {
            return;
        }

        const nodeIds = Array.from(pendingNodeChanges.current);
        const edgeIds = Array.from(pendingEdgeChanges.current);

        if (nodeIds.length === 0 && edgeIds.length === 0) {
            return;
        }

        try {
            setIsSaving(true);

            // Collect nodes to save
            const nodesToSave = nodeIds
                .map((nodeId) => nodes.find((n) => n.id === nodeId))
                .filter((node) => node !== undefined) as any[];

            // Collect edges to save
            const edgesToSave = edgeIds
                .map((edgeId) => edges.find((e) => e.id === edgeId))
                .filter((edge) => edge !== undefined) as any[];

            // Save both nodes and edges
            const savePromises: Promise<void>[] = [];
            if (nodesToSave.length > 0) {
                savePromises.push(
                    saveNodesToBoard(currentBoard.id, nodesToSave)
                );
            }
            if (edgesToSave.length > 0) {
                savePromises.push(
                    saveEdgesToBoard(currentBoard.id, edgesToSave)
                );
            }

            await Promise.all(savePromises);

            // Clear pending changes
            pendingNodeChanges.current.clear();
            pendingEdgeChanges.current.clear();

            console.log(
                `Saved: ${nodesToSave.length} nodes, ${edgesToSave.length} edges`
            );
        } catch (error) {
            console.error("Save failed:", error);
            showError && showError("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    }, [currentBoard, isLoading, isSwitchingBoard, nodes, edges, showError]);

    // Optimized debounced individual save (2 seconds to allow batching)
    const scheduleIndividualSave = useCallback(() => {
        if (individualSaveTimeoutRef.current) {
            clearTimeout(individualSaveTimeoutRef.current);
        }

        individualSaveTimeoutRef.current = setTimeout(() => {
            saveIndividualChanges();
        }, 2000); // 2 second delay to allow for batching multiple changes
    }, [saveIndividualChanges]);

    // Wrapped setters to track creations/removals even when bypassing onChange handlers
    const setNodes: UseBoardManagementReturn["setNodes"] = useCallback(
        (updaterOrNodes) => {
            _setNodes((prev) => {
                const next =
                    typeof updaterOrNodes === "function"
                        ? (updaterOrNodes as (nodes: Node[]) => Node[])(prev)
                        : (updaterOrNodes as Node[]);

                // Detect added nodes
                const prevIds = new Set(prev.map((n) => n.id));
                const nextIds = new Set(next.map((n) => n.id));
                let hasRelevantChanges = false;

                next.forEach((n) => {
                    if (!prevIds.has(n.id)) {
                        pendingNodeChanges.current.add(n.id);
                        hasRelevantChanges = true;
                    }
                });
                // Detect removed nodes
                prev.forEach((n) => {
                    if (!nextIds.has(n.id)) {
                        pendingNodeChanges.current.delete(n.id);
                        hasRelevantChanges = true;
                    }
                });

                if (hasRelevantChanges) {
                    scheduleIndividualSave();
                }

                return next;
            });
        },
        [_setNodes, scheduleIndividualSave]
    );

    const setEdges: UseBoardManagementReturn["setEdges"] = useCallback(
        (updaterOrEdges) => {
            _setEdges((prev) => {
                const next =
                    typeof updaterOrEdges === "function"
                        ? (updaterOrEdges as (edges: Edge[]) => Edge[])(prev)
                        : (updaterOrEdges as Edge[]);

                const prevIds = new Set(prev.map((e) => e.id));
                const nextIds = new Set(next.map((e) => e.id));
                let hasRelevantChanges = false;

                next.forEach((e) => {
                    if (!prevIds.has(e.id)) {
                        pendingEdgeChanges.current.add(e.id);
                        hasRelevantChanges = true;
                    }
                });
                prev.forEach((e) => {
                    if (!nextIds.has(e.id)) {
                        pendingEdgeChanges.current.delete(e.id);
                        hasRelevantChanges = true;
                    }
                });

                if (hasRelevantChanges) {
                    scheduleIndividualSave();
                }

                return next;
            });
        },
        [_setEdges, scheduleIndividualSave]
    );

    // Enhanced onNodesChange that tracks individual node changes - optimized
    const enhancedOnNodesChange = useCallback(
        (changes: any) => {
            console.log("Node changes:", changes);
            onNodesChange(changes);

            let hasRelevantChanges = false;

            // Track which nodes changed - only track meaningful changes
            changes.forEach((change: any) => {
                if (change.type === "add") {
                    if (change.item?.id) {
                        pendingNodeChanges.current.add(change.item.id);
                        hasRelevantChanges = true;
                        console.log("Added node to pending:", change.item.id);
                    }
                } else if (change.type === "remove") {
                    if (change.id) {
                        pendingNodeChanges.current.delete(change.id);
                        hasRelevantChanges = true;
                        console.log("Removed node from pending:", change.id);
                    }
                }
                // Skip 'select' changes as they don't need saving
            });

            // Only schedule save if there were relevant changes
            if (hasRelevantChanges) {
                console.log("Scheduling individual save due to node changes");
                scheduleIndividualSave();
            }
        },
        [onNodesChange, scheduleIndividualSave]
    );

    // Enhanced onEdgesChange that tracks individual edge changes - optimized
    const enhancedOnEdgesChange = useCallback(
        (changes: any) => {
            onEdgesChange(changes);

            let hasRelevantChanges = false;

            // Track which edges changed - only track meaningful changes
            changes.forEach((change: any) => {
                if (change.type === "add") {
                    if (change.item?.id) {
                        pendingEdgeChanges.current.add(change.item.id);
                        hasRelevantChanges = true;
                    }
                } else if (change.type === "remove") {
                    if (change.id) {
                        pendingEdgeChanges.current.delete(change.id);
                        hasRelevantChanges = true;
                    }
                }
                // Skip 'select' changes as they don't need saving
            });

            // Only schedule save if there were relevant changes
            if (hasRelevantChanges) {
                scheduleIndividualSave();
            }
        },
        [onEdgesChange, scheduleIndividualSave]
    );

    // Load boards and set initial state
    const loadBoards = useCallback(async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        // Prevent duplicate loads but allow refresh after user changes
        if (hasInitiallyLoaded.current && allBoards.length > 0) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            console.log("Loading boards for user:", user.id);

            const boards = await fetchAllBoards(user.id);
            console.log("Fetched boards:", boards);

            setAllBoards(boards);

            const openBoard = getOpenBoard(boards);
            if (openBoard) {
                console.log("Setting current board:", openBoard);
                setCurrentBoard(openBoard);
                const [n, e] = await Promise.all([
                    fetchNodesFromBoard(openBoard.id),
                    fetchEdgesFromBoard(openBoard.id),
                ]);
                console.log("Loaded nodes:", n.length, "edges:", e.length);
                setNodes(n as unknown as Node[]);
                setEdges(e as unknown as Edge[]);
            } else {
                console.log("No open board found, using initial data");
                setCurrentBoard(null);
                setNodes(initialNodes as unknown as Node[]);
                setEdges(initialEdges as unknown as Edge[]);
            }

            hasInitiallyLoaded.current = true;
        } catch (e) {
            console.error("Failed to load boards:", e);
            showError && showError(ERROR_MESSAGES.LOAD_FAILED);
            // Set fallback state
            setAllBoards([]);
            setCurrentBoard(null);
            setNodes(initialNodes as unknown as Node[]);
            setEdges(initialEdges as unknown as Edge[]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, showError, setNodes, setEdges, allBoards.length]);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    // Force refresh boards (useful for debugging and manual refresh)
    const forceRefreshBoards = useCallback(async () => {
        hasInitiallyLoaded.current = false;
        pendingNodeChanges.current.clear();
        pendingEdgeChanges.current.clear();
        await loadBoards();
    }, [loadBoards]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (individualSaveTimeoutRef.current) {
                clearTimeout(individualSaveTimeoutRef.current);
            }
        };
    }, []);

    // Periodic full board save with optimization
    const performPeriodicSave = useCallback(async () => {
        if (
            !currentBoard ||
            currentBoard.isFallback ||
            isLoading ||
            isSwitchingBoard
        ) {
            return;
        }

        // Skip periodic save if there are no pending individual changes and we're not saving
        const hasPendingChanges =
            pendingNodeChanges.current.size > 0 ||
            pendingEdgeChanges.current.size > 0;

        if (!hasPendingChanges && !isSaving) {
            console.log("Periodic save skipped - no pending changes detected");
            return;
        }

        try {
            setIsSaving(true);

            // If there are pending individual changes, save them first
            if (hasPendingChanges) {
                await saveIndividualChanges();
            } else {
                // Otherwise, perform full board save as backup
                await saveNodesToBoard(currentBoard.id, nodes as any);
                await saveEdgesToBoard(currentBoard.id, edges as any);
            }

            console.log("Periodic save completed successfully");
        } catch (error) {
            console.error("Periodic save failed:", error);
            showError && showError("Failed to save board changes");
        } finally {
            setIsSaving(false);
        }
    }, [
        currentBoard,
        isLoading,
        isSwitchingBoard,
        nodes,
        edges,
        isSaving,
        saveIndividualChanges,
        showError,
    ]);

    const switchToBoard = useCallback(
        async (boardId: string) => {
            if (!boardId || currentBoard?.id === boardId) return;

            // Clear pending changes before switching
            pendingNodeChanges.current.clear();
            pendingEdgeChanges.current.clear();

            setIsSwitchingBoard(true);
            try {
                const target = allBoards.find((b) => b.id === boardId) || null;
                if (!target) throw new Error(ERROR_MESSAGES.BOARD_NOT_FOUND);

                console.log("Switching to board:", target);
                setCurrentBoard(target);

                const [n, e] = await Promise.all([
                    fetchNodesFromBoard(boardId),
                    fetchEdgesFromBoard(boardId),
                ]);

                console.log(
                    "Loaded for switch - nodes:",
                    n.length,
                    "edges:",
                    e.length
                );
                setNodes(n as unknown as Node[]);
                setEdges(e as unknown as Edge[]);

                // Update board status
                await updateBoardStatus(boardId, { isOpen: true });
                if (currentBoard && currentBoard.id !== boardId) {
                    await updateBoardStatus(currentBoard.id, { isOpen: false });
                }

                // Update local board state
                setAllBoards((prev) =>
                    prev.map((b) => ({
                        ...b,
                        isOpen: b.id === boardId,
                    }))
                );
            } catch (e) {
                console.error("Failed to switch board:", e);
                showError && showError(ERROR_MESSAGES.LOAD_FAILED);
            } finally {
                setIsSwitchingBoard(false);
            }
        },
        [allBoards, currentBoard, setNodes, setEdges, showError]
    );

    const createNewBoard = useCallback(
        async (boardName?: string): Promise<BoardData | null> => {
            if (!user?.id) return null;
            try {
                const newBoard = await svcCreateBoard(
                    user.id,
                    boardName || null,
                    allBoards
                );

                // Update allBoards state first
                const updatedBoards = [
                    newBoard,
                    ...allBoards.map((b) => ({ ...b, isOpen: false })),
                ];
                setAllBoards(updatedBoards);

                // Now switch to the new board with updated boards list
                setCurrentBoard(newBoard);

                // Load the board content (should be empty for new boards)
                const [n, e] = await Promise.all([
                    fetchNodesFromBoard(newBoard.id),
                    fetchEdgesFromBoard(newBoard.id),
                ]);

                console.log(
                    "New board loaded - nodes:",
                    n.length,
                    "edges:",
                    e.length
                );
                setNodes(n as unknown as Node[]);
                setEdges(e as unknown as Edge[]);

                // Update board status in database
                await updateBoardStatus(newBoard.id, { isOpen: true });
                if (currentBoard) {
                    await updateBoardStatus(currentBoard.id, { isOpen: false });
                }

                showSuccess && showSuccess(SUCCESS_MESSAGES.BOARD_CREATED);
                return newBoard;
            } catch (e) {
                console.error("Failed to create board:", e);
                showError && showError(ERROR_MESSAGES.SAVE_FAILED);
                return null;
            }
        },
        [
            user?.id,
            allBoards,
            currentBoard,
            setNodes,
            setEdges,
            showSuccess,
            showError,
        ]
    );

    const deleteBoard = useCallback(
        async (boardId: string) => {
            if (!boardId) return;
            try {
                await svcDeleteBoard(boardId);
                setAllBoards((prev) => prev.filter((b) => b.id !== boardId));
                if (currentBoard?.id === boardId) {
                    const next =
                        allBoards.find((b) => b.id !== boardId) || null;
                    setCurrentBoard(next);
                    if (next) {
                        const [n, e] = await Promise.all([
                            fetchNodesFromBoard(next.id),
                            fetchEdgesFromBoard(next.id),
                        ]);
                        setNodes(n as unknown as Node[]);
                        setEdges(e as unknown as Edge[]);
                    } else {
                        setNodes(initialNodes as unknown as Node[]);
                        setEdges(initialEdges as unknown as Edge[]);
                    }
                }
                showSuccess && showSuccess(SUCCESS_MESSAGES.BOARD_DELETED);
            } catch (e) {
                showError && showError(ERROR_MESSAGES.SAVE_FAILED);
            }
        },
        [currentBoard, allBoards, setNodes, setEdges, showSuccess, showError]
    );

    const updateBoardName = useCallback(
        async (name: string) => {
            if (!currentBoard) return;
            try {
                await updateBoardStatus(currentBoard.id, { name });
                setCurrentBoard((b) => (b ? { ...b, name } : b));
                setAllBoards((prev) =>
                    prev.map((b) =>
                        b.id === currentBoard.id ? { ...b, name } : b
                    )
                );
                showSuccess && showSuccess(SUCCESS_MESSAGES.BOARD_RENAMED);
            } catch (e) {
                showError && showError(ERROR_MESSAGES.SAVE_FAILED);
            }
        },
        [currentBoard, showSuccess, showError]
    );

    const clearBoardState = useCallback(() => {
        setNodes(initialNodes as unknown as Node[]);
        setEdges(initialEdges as unknown as Edge[]);
        setAllBoards([]);
        setCurrentBoard(null);
    }, [setNodes, setEdges]);

    const getLastTwoLayouts = useCallback(() => {
        return lastLayoutsRef.current.slice(-2);
    }, []);

    const addLayout = useCallback((layout: number) => {
        lastLayoutsRef.current = [...lastLayoutsRef.current, layout].slice(-2);
    }, []);

    const saveNewNodeContent = saveIndividualChanges;

    return {
        nodes,
        edges,
        allBoards,
        currentBoard,
        isLoading,
        isSwitchingBoard,
        isSaving,
        onNodesChange: enhancedOnNodesChange,
        onEdgesChange: enhancedOnEdgesChange,
        setNodes,
        setEdges,
        switchToBoard,
        createNewBoard,
        deleteBoard,
        updateBoardName,
        clearBoardState,
        saveNewNodeContent,
        performPeriodicSave,
        forceRefreshBoards,
        getLastTwoLayouts,
        addLayout,
    };
};
