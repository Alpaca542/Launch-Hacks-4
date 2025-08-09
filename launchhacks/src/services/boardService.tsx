import supabase from "../supabase-client";
import { COLLECTIONS, ERROR_MESSAGES } from "../utils/constants";
import { validateUser } from "../utils/validation";

// TypeScript interfaces
export interface BoardData {
    id: string;
    userId: string;
    name: string;
    createdAt: string;
    isOpen: boolean;
    isFallback?: boolean;
    updatedAt?: string;
}

export interface NodeData {
    id: string;
    type: string;
    data: { [key: string]: any };
    position: { x: number; y: number };
    draggable?: boolean;
    style?: { [key: string]: any };
    updatedAt?: string;
}

export interface EdgeData {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    style?: { [key: string]: any };
    markerEnd?: { [key: string]: any };
    updatedAt?: string;
}

// Initial fallback data
export const initialNodes: NodeData[] = [
    {
        id: "1",
        type: "staticEditable",
        data: {
            label: "The _artificial intelligence_ system processes _natural language_ effectively",
            title: "AI & Natural Language",
            suggestions: [
                "Machine Learning",
                "Neural Networks",
                "Deep Learning",
            ],
            tokenColors: {},
            previousNode: null, // Initial node has no previous node
        },
        position: { x: 250, y: 25 },
        draggable: false, // Static nodes are not draggable
    },
];

export const initialEdges: EdgeData[] = [];

const now = () => new Date().toISOString();

export const fetchAllBoards = async (userId: string): Promise<BoardData[]> => {
    if (!validateUser({ uid: userId })) {
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }
    const { data, error } = await supabase
        .from(COLLECTIONS.BOARDS)
        .select("id,user_id,name,created_at,is_open,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (error) throw new Error(ERROR_MESSAGES.LOAD_FAILED);
    if (!data || data.length === 0) {
        const defaultBoard: BoardData = {
            id: `board_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            userId,
            name: "Default Board",
            createdAt: now(),
            isOpen: true,
        };
        const { error: insertErr } = await supabase
            .from(COLLECTIONS.BOARDS)
            .insert({
                id: defaultBoard.id,
                user_id: defaultBoard.userId,
                name: defaultBoard.name,
                created_at: defaultBoard.createdAt,
                is_open: defaultBoard.isOpen,
            });
        if (insertErr) throw new Error(ERROR_MESSAGES.LOAD_FAILED);
        return [defaultBoard];
    }
    return data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        createdAt: r.created_at,
        isOpen: !!r.is_open,
        updatedAt: r.updated_at ?? undefined,
    }));
};

export const fetchNodesFromBoard = async (
    boardId: string
): Promise<NodeData[]> => {
    if (!boardId) return initialNodes;
    const { data, error } = await supabase
        .from(COLLECTIONS.NODES)
        .select("id,board_id,type,data,position,draggable,style,updated_at")
        .eq("board_id", boardId);
    if (error) return initialNodes;
    if (!data || data.length === 0) return initialNodes;
    return data.map((r: any) => ({
        id: r.id,
        type: r.type,
        data: {
            ...(r.data || {}),
            tokenColors: r.data?.tokenColors || {},
            previousNode: r.data?.previousNode ?? null,
        },
        position: r.position,
        draggable: r.draggable ?? undefined,
        style: r.style ?? undefined,
        updatedAt: r.updated_at ?? undefined,
    }));
};

export const fetchEdgesFromBoard = async (
    boardId: string
): Promise<EdgeData[]> => {
    if (!boardId) return initialEdges;
    const { data, error } = await supabase
        .from(COLLECTIONS.EDGES)
        .select(
            "id,board_id,source,target,source_handle,target_handle,style,marker_end,updated_at"
        )
        .eq("board_id", boardId);
    if (error) return initialEdges;
    if (!data || data.length === 0) return initialEdges;
    return data.map((r: any) => ({
        id: r.id,
        source: r.source,
        target: r.target,
        sourceHandle: r.source_handle ?? undefined,
        targetHandle: r.target_handle ?? undefined,
        style: r.style ?? undefined,
        markerEnd: r.marker_end ?? undefined,
        updatedAt: r.updated_at ?? undefined,
    }));
};

// Save individual node to board
export const saveIndividualNode = async (
    boardId: string,
    node: NodeData
): Promise<void> => {
    if (!boardId || !node) return;
    const payload = {
        id: node.id,
        board_id: boardId,
        type: node.type,
        data: node.data,
        position: node.position,
        draggable: node.draggable ?? null,
        style: node.style ?? null,
        updated_at: now(),
    };
    const { error } = await supabase
        .from(COLLECTIONS.NODES)
        .upsert(payload, { onConflict: "id" });
    if (error) throw new Error(ERROR_MESSAGES.SAVE_FAILED);
};

// Save individual edge to board
export const saveIndividualEdge = async (
    boardId: string,
    edge: EdgeData
): Promise<void> => {
    if (!boardId || !edge) return;
    const payload = {
        id: edge.id,
        board_id: boardId,
        source: edge.source,
        target: edge.target,
        source_handle: edge.sourceHandle ?? null,
        target_handle: edge.targetHandle ?? null,
        style: edge.style ?? null,
        marker_end: edge.markerEnd ?? null,
        updated_at: now(),
    };
    const { error } = await supabase
        .from(COLLECTIONS.EDGES)
        .upsert(payload, { onConflict: "id" });
    if (error) throw new Error(ERROR_MESSAGES.SAVE_FAILED);
};

export const saveNodesToBoard = async (
    boardId: string,
    nodesToSave: NodeData[]
): Promise<void> => {
    if (!boardId || !Array.isArray(nodesToSave)) return;
    if (nodesToSave.length === 0) return;
    const rows = nodesToSave.map((n) => ({
        id: n.id,
        board_id: boardId,
        type: n.type,
        data: n.data,
        position: n.position,
        draggable: n.draggable ?? null,
        style: n.style ?? null,
        updated_at: now(),
    }));
    const { error } = await supabase
        .from(COLLECTIONS.NODES)
        .upsert(rows, { onConflict: "id" });
    if (error) throw new Error(ERROR_MESSAGES.SAVE_FAILED);
};

export const saveEdgesToBoard = async (
    boardId: string,
    edgesToSave: EdgeData[]
): Promise<void> => {
    if (!boardId || !Array.isArray(edgesToSave)) return;
    const rows = (edgesToSave || []).map((e) => ({
        id: e.id,
        board_id: boardId,
        source: e.source,
        target: e.target,
        source_handle: e.sourceHandle ?? null,
        target_handle: e.targetHandle ?? null,
        style: e.style ?? null,
        marker_end: e.markerEnd ?? null,
        updated_at: now(),
    }));
    if (rows.length === 0) return;
    const { error } = await supabase
        .from(COLLECTIONS.EDGES)
        .upsert(rows, { onConflict: "id" });
    if (error) throw new Error(ERROR_MESSAGES.SAVE_FAILED);
};

export const createBoard = async (
    userId: string,
    boardName: string | null,
    allBoards: BoardData[]
): Promise<BoardData> => {
    if (!validateUser({ uid: userId }))
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    const newBoard: BoardData = {
        id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: boardName || `Board ${allBoards.length + 1}`,
        createdAt: now(),
        isOpen: false,
    };
    const { error } = await supabase.from(COLLECTIONS.BOARDS).insert({
        id: newBoard.id,
        user_id: newBoard.userId,
        name: newBoard.name,
        created_at: newBoard.createdAt,
        is_open: newBoard.isOpen,
    });
    if (error) throw new Error("Failed to create board. Please try again.");
    return newBoard;
};

export const deleteBoard = async (boardId: string): Promise<void> => {
    if (!boardId) throw new Error("Board ID is required for deletion");
    const { error: e1 } = await supabase
        .from(COLLECTIONS.NODES)
        .delete()
        .eq("board_id", boardId);
    if (e1) throw e1;
    const { error: e2 } = await supabase
        .from(COLLECTIONS.EDGES)
        .delete()
        .eq("board_id", boardId);
    if (e2) throw e2;
    const { error: e3 } = await supabase
        .from(COLLECTIONS.BOARDS)
        .delete()
        .eq("id", boardId);
    if (e3) throw e3;
};

export const updateBoardStatus = async (
    boardId: string,
    updates: Partial<BoardData>
): Promise<void> => {
    if (!boardId || !updates)
        throw new Error("Board ID and updates are required");
    const payload: any = { updated_at: now() };
    if (typeof updates.name === "string") payload.name = updates.name;
    if (typeof updates.isOpen === "boolean") payload.is_open = updates.isOpen;
    const { error } = await supabase
        .from(COLLECTIONS.BOARDS)
        .update(payload)
        .eq("id", boardId);
    if (error) throw error;
};
