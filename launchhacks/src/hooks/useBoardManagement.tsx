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
    isSwitchingBoard: boolean;
    isSaving: boolean;
    onNodesChange: any;
    onEdgesChange: any;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    switchToBoard: (boardId: string) => Promise<void>;
    createNewBoard: (boardName?: string) => Promise<void>;
    deleteBoard: (boardId: string) => Promise<void>;
    updateBoardName: (name: string) => Promise<void>;
    clearBoardState: () => void;
    saveNewNodeContent: () => Promise<void>;
    performPeriodicSave: () => Promise<void>;
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
    const [nodes, setNodes, onNodesChange] = useNodesState(
        initialNodes as unknown as Node[]
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(
        initialEdges as unknown as Edge[]
    );
    const [allBoards, setAllBoards] = useState<BoardData[]>([]);
    const [currentBoard, setCurrentBoard] = useState<BoardData | null>(null);
    const [isSwitchingBoard, setIsSwitchingBoard] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const lastLayoutsRef = useRef<number[]>([]);

    const loadBoards = useCallback(async () => {
        if (!user?.id) return;
        try {
            const boards = await fetchAllBoards(user.id);
            setAllBoards(boards);
            const open = boards.find((b) => b.isOpen) || boards[0] || null;
            if (open) {
                setCurrentBoard(open);
                const [n, e] = await Promise.all([
                    fetchNodesFromBoard(open.id),
                    fetchEdgesFromBoard(open.id),
                ]);
                setNodes(n as unknown as Node[]);
                setEdges(e as unknown as Edge[]);
            }
        } catch (e) {
            showError && showError(ERROR_MESSAGES.LOAD_FAILED);
        }
    }, [user?.id, showError, setNodes, setEdges]);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    const switchToBoard = useCallback(
        async (boardId: string) => {
            if (!boardId || currentBoard?.id === boardId) return;
            setIsSwitchingBoard(true);
            try {
                const target = allBoards.find((b) => b.id === boardId) || null;
                if (!target) throw new Error(ERROR_MESSAGES.BOARD_NOT_FOUND);
                setCurrentBoard(target);
                const [n, e] = await Promise.all([
                    fetchNodesFromBoard(boardId),
                    fetchEdgesFromBoard(boardId),
                ]);
                setNodes(n as unknown as Node[]);
                setEdges(e as unknown as Edge[]);
                await updateBoardStatus(boardId, { isOpen: true });
                if (currentBoard)
                    await updateBoardStatus(currentBoard.id, { isOpen: false });
            } catch (e) {
                showError && showError(ERROR_MESSAGES.LOAD_FAILED);
            } finally {
                setIsSwitchingBoard(false);
            }
        },
        [allBoards, currentBoard, setNodes, setEdges, showError]
    );

    const performSave = useCallback(async () => {
        if (!currentBoard) return;
        setIsSaving(true);
        try {
            await saveNodesToBoard(currentBoard.id, nodes as any);
            await saveEdgesToBoard(currentBoard.id, edges as any);
            showSuccess && showSuccess(SUCCESS_MESSAGES.CHANGES_SAVED);
        } catch (e) {
            showError && showError(ERROR_MESSAGES.SAVE_FAILED);
        } finally {
            setIsSaving(false);
        }
    }, [currentBoard, nodes, edges, showSuccess, showError]);

    const createNewBoard = useCallback(
        async (boardName?: string) => {
            if (!user?.id) return;
            try {
                const newBoard = await svcCreateBoard(
                    user.id,
                    boardName || null,
                    allBoards
                );
                setAllBoards((prev) => [
                    newBoard,
                    ...prev.map((b) => ({ ...b, isOpen: false })),
                ]);
                await switchToBoard(newBoard.id);
                showSuccess && showSuccess(SUCCESS_MESSAGES.BOARD_CREATED);
            } catch (e) {
                showError && showError(ERROR_MESSAGES.SAVE_FAILED);
            }
        },
        [user?.id, allBoards, switchToBoard, showSuccess, showError]
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

    const saveNewNodeContent = performSave;
    const performPeriodicSave = performSave;

    return {
        nodes,
        edges,
        allBoards,
        currentBoard,
        isSwitchingBoard,
        isSaving,
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
        performPeriodicSave,
        getLastTwoLayouts,
        addLayout,
    };
};
