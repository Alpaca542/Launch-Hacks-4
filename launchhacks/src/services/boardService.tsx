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
        title?: string;
        suggestions?: string[];
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
        type: "staticEditable",
        data: {
            label: "The _artificial intelligence_ system processes _natural language_ effectively",
            tokenColors: {},
            previousNode: null, // Initial node has no previous node
        },
        position: { x: 250, y: 25 },
        draggable: false, // Static nodes are not draggable
    },
];

export const initialEdges: EdgeData[] = [];

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
            console.log("Created default board:", defaultBoard);
            return [defaultBoard];
        }

        const boards: BoardData[] = boardsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<BoardData, "id">),
        }));

        console.log("Fetched all boards:", boards);
        return boards;
    } catch (err: any) {
        console.error("Fetch all boards error:", err);

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
            console.log("No nodes found for board, using initial nodes");
            return initialNodes;
        }

        const nodesFromFirestore: NodeData[] = nodesSnapshot.docs.map((doc) => {
            const docData = doc.data();

            // Ensure data has all required properties
            const nodeData = {
                ...docData.data,
                // Ensure tokenColors exists for backward compatibility
                tokenColors: docData.data?.tokenColors || {},
                // Ensure previousNode exists for backward compatibility
                previousNode: docData.data?.previousNode || null,
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

        console.log("Fetched nodes from board:", nodesFromFirestore);
        return nodesFromFirestore;
    } catch (err) {
        console.error("Fetch nodes error:", err);
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
            console.log("No edges found for board, using initial edges");
            return initialEdges;
        }

        const edgesFromFirestore: EdgeData[] = edgesSnapshot.docs.map(
            (doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<EdgeData, "id">),
            })
        );

        console.log("Fetched edges from board:", edgesFromFirestore);
        return edgesFromFirestore;
    } catch (err) {
        console.error("Fetch edges error:", err);
        return initialEdges;
    }
};

export const saveNodesToBoard = async (
    boardId: string,
    nodesToSave: NodeData[]
): Promise<void> => {
    if (!boardId || !nodesToSave?.length) {
        console.warn("Invalid parameters for saving nodes:", {
            boardId,
            nodesCount: nodesToSave?.length,
        });
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

            // Filter out null values to prevent Firestore errors
            const nodeData: any = {
                type: node.type,
                data: node.data,
                position: node.position,
                updatedAt: Timestamp.now(),
            };

            // Only include draggable if it's not null or undefined
            if (node.draggable != null) {
                nodeData.draggable = node.draggable;
            }

            // Include style if it exists
            if (node.style != null) {
                nodeData.style = node.style;
            }

            batch.set(nodeRef, nodeData);
        });

        await batch.commit();
        console.log("Nodes saved to board");
    } catch (err) {
        console.error("Save nodes error:", err);
        throw new Error(ERROR_MESSAGES.SAVE_FAILED);
    }
};

export const saveEdgesToBoard = async (
    boardId: string,
    edgesToSave: EdgeData[]
): Promise<void> => {
    if (!boardId || !edgesToSave?.length) {
        console.warn("Invalid parameters for saving edges:", {
            boardId,
            edgesCount: edgesToSave?.length,
        });
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

            // Filter out null values to prevent Firestore errors
            const edgeData: any = {
                source: edge.source,
                target: edge.target,
                updatedAt: Timestamp.now(),
            };

            // Only include sourceHandle and targetHandle if they're not null or undefined
            if (edge.sourceHandle != null) {
                edgeData.sourceHandle = edge.sourceHandle;
            }
            if (edge.targetHandle != null) {
                edgeData.targetHandle = edge.targetHandle;
            }

            // Include style if it exists (for edge colors)
            if (edge.style != null) {
                edgeData.style = edge.style;
            }

            // Include markerEnd if it exists (for arrow colors)
            if (edge.markerEnd != null) {
                edgeData.markerEnd = edge.markerEnd;
            }

            batch.set(edgeRef, edgeData);
        });

        await batch.commit();
        console.log("Edges saved to board");
    } catch (err) {
        console.error("Save edges error:", err);
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

        console.log("Creating board:", newBoard);
        await setDoc(doc(db, COLLECTIONS.BOARDS, newBoard.id), newBoard);
        console.log("Board created successfully:", newBoard);
        return newBoard;
    } catch (error: any) {
        console.error("Error creating new board:", error);

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
