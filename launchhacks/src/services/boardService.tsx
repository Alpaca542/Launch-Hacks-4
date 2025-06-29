import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, ERROR_MESSAGES } from "../utils/constants";
import { validateUser } from "../utils/validation";

// TypeScript interfaces
export interface BoardData {
    id: string;
    userId: string;
    name: string;
    createdAt: Date | Timestamp;
    isOpen: boolean;
    isFallback?: boolean;
    updatedAt?: Date | Timestamp;
}

export interface NodeData {
    id: string;
    type: string;
    data: {
        label: string;
        summary?: string;
        full_text?: string;
        [key: string]: any;
    };
    position: {
        x: number;
        y: number;
    };
    draggable?: boolean;
    style?: {
        [key: string]: any;
    };
    updatedAt?: Date | Timestamp;
}

export interface EdgeData {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    style?: {
        [key: string]: any;
    };
    markerEnd?: {
        [key: string]: any;
    };
    updatedAt?: Date | Timestamp;
}

// Initial fallback data
export const initialNodes: NodeData[] = [
    {
        id: "1",
        type: "draggableEditable",
        data: {
            label: "The _artificial intelligence_ system processes _natural language_ effectively",
            summary:
                "The _artificial intelligence_ system processes _natural language_ effectively",
            full_text: "",
        },
        position: { x: 250, y: 25 },
    },
    {
        id: "2",
        type: "draggableEditable",
        data: {
            label: "This is a simple sentence with multiple words to demonstrate word mode functionality",
            summary:
                "This is a simple sentence with multiple words to demonstrate word mode functionality",
            full_text: "",
        },
        position: { x: 100, y: 125 },
    },
    {
        id: "3",
        type: "draggableEditable",
        data: {
            label: "_Machine learning_ algorithms can _predict outcomes_ with high accuracy",
            summary:
                "_Machine learning_ algorithms can _predict outcomes_ with high accuracy",
            full_text: "",
        },
        position: { x: 400, y: 125 },
    },
    {
        id: "4",
        type: "staticEditable",
        data: {
            label: "Static node with _key concepts_ highlighted",
            summary: "Static node with _key concepts_ highlighted",
            full_text: "",
        },
        position: { x: 250, y: 200 },
        draggable: false,
    },
];

export const initialEdges: EdgeData[] = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e1-3", source: "1", target: "3" },
    { id: "e2-4", source: "2", target: "4" },
    { id: "e3-4", source: "3", target: "4" },
];

export const fetchAllBoards = async (userId: string): Promise<BoardData[]> => {
    if (!validateUser({ uid: userId })) {
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
        const boardsCollection = collection(db, COLLECTIONS.BOARDS);
        const boardsQuery = query(
            boardsCollection,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const boardsSnapshot = await getDocs(boardsQuery);

        if (boardsSnapshot.empty) {
            // Create a default board if none exists
            const defaultBoard = {
                id: `board_${Date.now()}`,
                userId: userId,
                name: "Default Board",
                createdAt: Timestamp.now(),
                isOpen: true,
            };

            await setDoc(
                doc(db, COLLECTIONS.BOARDS, defaultBoard.id),
                defaultBoard
            );
            return [defaultBoard];
        }

        const boards: BoardData[] = boardsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<BoardData, "id">),
        }));

        return boards;
    } catch (err: any) {
        // Handle specific Firestore index error
        if (
            err.code === "failed-precondition" ||
            err.message?.includes("requires an index")
        ) {
            const indexMessage = `
Firestore database index is missing. To fix this:

1. Visit the Firebase Console: https://console.firebase.google.com/
2. Navigate to your project
3. Go to Firestore Database > Indexes
4. Create a composite index for collection "boards" with:
   - Field: userId (Ascending)
   - Field: createdAt (Descending)

Or click this direct link if available in the error logs above.

Using fallback board data for now...
            `.trim();

            console.warn(indexMessage);

            // Return fallback board with initial data
            const fallbackBoard = {
                id: `fallback_${Date.now()}`,
                userId: userId,
                name: "Fallback Board (Create Index)",
                createdAt: Timestamp.now(),
                isOpen: true,
                isFallback: true,
            };

            return [fallbackBoard];
        }

        throw new Error(ERROR_MESSAGES.LOAD_FAILED);
    }
};

export const fetchNodesFromBoard = async (
    boardId: string
): Promise<NodeData[]> => {
    if (!boardId) {
        console.warn("No board ID provided for fetching nodes");
        return initialNodes;
    }

    try {
        const nodesCollection = collection(
            db,
            COLLECTIONS.BOARDS,
            boardId,
            COLLECTIONS.NODES
        );
        const nodesSnapshot = await getDocs(nodesCollection);

        if (nodesSnapshot.empty) {
            return initialNodes;
        }

        const nodesFromFirestore: NodeData[] = nodesSnapshot.docs.map((doc) => {
            const docData = doc.data();

            // Ensure data has all required properties
            const nodeData = {
                ...docData.data,
            };

            const node = {
                id: doc.id,
                type: docData.type,
                position: docData.position,
                data: nodeData,
                draggable: docData.draggable,
                style: docData.style,
            };
            return node;
        });

        return nodesFromFirestore;
    } catch (err) {
        return initialNodes;
    }
};

export const fetchEdgesFromBoard = async (
    boardId: string
): Promise<EdgeData[]> => {
    if (!boardId) {
        console.warn("No board ID provided for fetching edges");
        return initialEdges;
    }

    try {
        const edgesCollection = collection(
            db,
            COLLECTIONS.BOARDS,
            boardId,
            COLLECTIONS.EDGES
        );
        const edgesSnapshot = await getDocs(edgesCollection);

        if (edgesSnapshot.empty) {
            return initialEdges;
        }

        const edgesFromFirestore: EdgeData[] = edgesSnapshot.docs.map(
            (doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<EdgeData, "id">),
            })
        );

        return edgesFromFirestore;
    } catch (err) {
        return initialEdges;
    }
};

export const saveNodesToBoard = async (
    boardId: string,
    nodesToSave: NodeData[]
): Promise<void> => {
    if (!boardId || !nodesToSave?.length) {
        return;
    }

    try {
        // Use batch writes for better performance and atomicity
        const batch = writeBatch(db);

        nodesToSave.forEach((node) => {
            const nodeRef = doc(
                db,
                COLLECTIONS.BOARDS,
                boardId,
                COLLECTIONS.NODES,
                node.id
            );

            // Filter out undefined values to prevent Firestore errors
            const nodeData: any = {
                type: node.type,
                data: node.data,
                position: node.position,
                updatedAt: Timestamp.now(),
            };

            // Only include draggable if it's not undefined
            if (node.draggable !== undefined) {
                nodeData.draggable = node.draggable;
            }

            // Include style if it exists
            if (node.style !== undefined) {
                nodeData.style = node.style;
            }

            batch.set(nodeRef, nodeData);
        });

        await batch.commit();
    } catch (err) {
        throw new Error(ERROR_MESSAGES.SAVE_FAILED);
    }
};

export const saveEdgesToBoard = async (
    boardId: string,
    edgesToSave: EdgeData[]
): Promise<void> => {
    if (!boardId || !edgesToSave?.length) {
        return;
    }

    try {
        // Use batch writes for better performance and atomicity
        const batch = writeBatch(db);

        edgesToSave.forEach((edge) => {
            const edgeRef = doc(
                db,
                COLLECTIONS.BOARDS,
                boardId,
                COLLECTIONS.EDGES,
                edge.id
            );

            // Filter out undefined values to prevent Firestore errors
            const edgeData: any = {
                source: edge.source,
                target: edge.target,
                updatedAt: Timestamp.now(),
            };

            // Only include sourceHandle and targetHandle if they're not undefined
            if (edge.sourceHandle !== undefined) {
                edgeData.sourceHandle = edge.sourceHandle;
            }
            if (edge.targetHandle !== undefined) {
                edgeData.targetHandle = edge.targetHandle;
            }

            // Include style if it exists (for edge colors)
            if (edge.style !== undefined) {
                edgeData.style = edge.style;
            }

            // Include markerEnd if it exists (for arrow colors)
            if (edge.markerEnd !== undefined) {
                edgeData.markerEnd = edge.markerEnd;
            }

            batch.set(edgeRef, edgeData);
        });

        await batch.commit();
    } catch (err) {
        throw new Error(ERROR_MESSAGES.SAVE_FAILED);
    }
};

export const createBoard = async (
    userId: string,
    boardName: string | null,
    allBoards: BoardData[]
): Promise<BoardData> => {
    if (!validateUser({ uid: userId })) {
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    try {
        const newBoard = {
            id: `board_${Date.now()}`,
            userId: userId,
            name: boardName || `Board ${allBoards.length + 1}`,
            createdAt: Timestamp.now(),
            isOpen: false,
        };

        await setDoc(doc(db, COLLECTIONS.BOARDS, newBoard.id), newBoard);
        return newBoard;
    } catch (error: any) {
        // Handle specific Firestore errors
        if (error.code === "permission-denied") {
            throw new Error(
                "Permission denied. Please check your Firestore security rules."
            );
        } else if (error.code === "failed-precondition") {
            throw new Error(
                "Database configuration error. Please check Firestore setup."
            );
        }

        throw new Error("Failed to create board. Please try again.");
    }
};

export const deleteBoard = async (boardId: string): Promise<void> => {
    if (!boardId) {
        throw new Error("Board ID is required for deletion");
    }

    try {
        await deleteDoc(doc(db, COLLECTIONS.BOARDS, boardId));
        console.log("Board deleted successfully");
    } catch (error: any) {
        console.error("Error deleting board:", error);
        if (error.code === "permission-denied") {
            throw new Error("Permission denied. Cannot delete this board.");
        }
        throw error;
    }
};

export const updateBoardStatus = async (
    boardId: string,
    updates: Partial<BoardData>
): Promise<void> => {
    if (!boardId || !updates) {
        throw new Error("Board ID and updates are required");
    }

    try {
        // Ensure we use proper Timestamp for any date fields
        const sanitizedUpdates = {
            ...updates,
            updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, COLLECTIONS.BOARDS, boardId), sanitizedUpdates, {
            merge: true,
        });
        console.log("Board status updated:", sanitizedUpdates);
    } catch (error) {
        console.error("Error updating board status:", error);
        throw error;
    }
};
