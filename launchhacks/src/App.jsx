import { useCallback, useState, useEffect } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";
import AuthWindow from "./components/AuthWindow";
import StaticEditableNode from "./components/StaticEditableNode";
import SideBar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DraggableEditableNode from "./components/DraggableEditableNode";
import { db, auth } from "./firebase";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const nodeTypes = {
    staticEditable: StaticEditableNode,
    draggableEditable: DraggableEditableNode,
};

// Initial nodes and edges (fallback data)
const initialNodes = [
    {
        id: "1",
        type: "draggableEditable",
        data: { label: "Node A" },
        position: { x: 250, y: 25 },
    },
    {
        id: "2",
        type: "draggableEditable",
        data: { label: "Node B" },
        position: { x: 100, y: 125 },
    },
    {
        id: "3",
        type: "draggableEditable",
        data: { label: "Node C" },
        position: { x: 400, y: 125 },
    },
    {
        id: "4",
        type: "staticEditable",
        data: { label: "Node D" },
        position: { x: 250, y: 200 },
        draggable: false,
    },
];

const initialEdges = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e1-3", source: "1", target: "3" },
    { id: "e2-4", source: "2", target: "4" },
    { id: "e3-4", source: "3", target: "4" },
];

function App() {
    const [user, setUser] = useState(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allBoards, setAllBoards] = useState([]);
    const [currentBoard, setCurrentBoard] = useState(null);
    const SetNewBoardName = (name) => {
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

            setDoc(doc(db, "boards", currentBoard.id), updatedBoard)
                .then(() => {
                    console.log("Board name updated successfully");
                })
                .catch((error) => {
                    console.error("Error updating board name:", error);
                });
        }
    };
    // Initialize authentication
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                console.log("User signed in:", user.uid);
            } else {
                setUser(null);
                console.log("No user signed in");
            }
        });

        return () => unsubscribe();
    }, []);
    const onAuthed = (user) => {
        setUser(user);
    };
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setAllBoards([]);
            setCurrentBoard(null);
            setNodes([]);
            setEdges([]);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const askAI = async (message) => {
        try {
            const response = await fetch(
                `https://groqchat-zm2y2mo6eq-uc.a.run.app?message=${message}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const fetchAllBoards = async (userId) => {
        try {
            const boardsCollection = collection(db, "boards");
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
                    createdAt: new Date(),
                    isOpen: true,
                };

                await setDoc(doc(db, "boards", defaultBoard.id), defaultBoard);
                console.log("Created default board:", defaultBoard);
                return [defaultBoard];
            }

            const boards = boardsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log("Fetched all boards:", boards);
            return boards;
        } catch (err) {
            console.error("Fetch all boards error:", err);
            return [];
        }
    };

    const getOpenBoard = (boards) => {
        const openBoard = boards.find((board) => board.isOpen === true);
        if (openBoard) {
            return openBoard;
        }

        // If no board is marked as open, mark the first one as open
        if (boards.length > 0) {
            const firstBoard = { ...boards[0], isOpen: true };
            setDoc(doc(db, "boards", firstBoard.id), firstBoard);
            return firstBoard;
        }

        return null;
    };

    const switchToBoard = async (boardId) => {
        try {
            // Don't switch to the same board
            if (currentBoard?.id === boardId) {
                return;
            }

            // Close current board
            if (currentBoard) {
                const closedBoard = { ...currentBoard, isOpen: false };
                await setDoc(doc(db, "boards", currentBoard.id), closedBoard);

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
                await setDoc(doc(db, "boards", boardId), openedBoard);

                setCurrentBoard(openedBoard);

                // Update in allBoards array
                setAllBoards((prevBoards) =>
                    prevBoards.map((board) =>
                        board.id === boardId ? openedBoard : board
                    )
                );

                // Load nodes and edges for the new board
                const [nodesData, edgesData] = await Promise.all([
                    fetchNodesFromBoard(boardId),
                    fetchEdgesFromBoard(boardId),
                ]);

                setNodes(nodesData);
                setEdges(edgesData);
            } else {
                console.error("Board not found:", boardId);
            }
        } catch (error) {
            console.error("Error switching board:", error);
        }
    };

    const createNewBoard = async () => {
        try {
            const newBoard = {
                id: `board_${Date.now()}`,
                userId: user.uid,
                name: `Board ${allBoards.length + 1}`,
                createdAt: new Date(),
                isOpen: false,
            };

            await setDoc(doc(db, "boards", newBoard.id), newBoard);

            setAllBoards((prevBoards) => [newBoard, ...prevBoards]);
            console.log("Created new board:", newBoard);

            return newBoard;
        } catch (error) {
            console.error("Error creating new board:", error);
            return null;
        }
    };

    const fetchNodesFromBoard = async (boardId) => {
        try {
            const nodesCollection = collection(db, "boards", boardId, "nodes");
            const nodesSnapshot = await getDocs(nodesCollection);

            if (nodesSnapshot.empty) {
                console.log("No nodes found for board, using initial nodes");
                return initialNodes;
            }

            const nodesFromFirestore = nodesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log("Fetched nodes from board:", nodesFromFirestore);
            return nodesFromFirestore;
        } catch (err) {
            console.error("Fetch nodes error:", err);
            return initialNodes;
        }
    };

    const fetchEdgesFromBoard = async (boardId) => {
        try {
            const edgesCollection = collection(db, "boards", boardId, "edges");
            const edgesSnapshot = await getDocs(edgesCollection);

            if (edgesSnapshot.empty) {
                console.log("No edges found for board, using initial edges");
                return initialEdges;
            }

            const edgesFromFirestore = edgesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log("Fetched edges from board:", edgesFromFirestore);
            return edgesFromFirestore;
        } catch (err) {
            console.error("Fetch edges error:", err);
            return initialEdges;
        }
    };

    const saveNodesToBoard = async (boardId, nodesToSave) => {
        try {
            const promises = nodesToSave.map((node) =>
                setDoc(doc(db, "boards", boardId, "nodes", node.id), {
                    type: node.type,
                    data: node.data,
                    position: node.position,
                    draggable: node.draggable,
                })
            );
            await Promise.all(promises);
            console.log("Nodes saved to board");
        } catch (err) {
            console.error("Save nodes error:", err);
        }
    };

    const saveEdgesToBoard = async (boardId, edgesToSave) => {
        try {
            const promises = edgesToSave.map((edge) =>
                setDoc(doc(db, "boards", boardId, "edges", edge.id), {
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle,
                })
            );
            await Promise.all(promises);
            console.log("Edges saved to board");
        } catch (err) {
            console.error("Save edges error:", err);
        }
    };

    // Load initial data when user is authenticated
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;

            try {
                setIsLoading(true);

                // Fetch all user's boards
                const boards = await fetchAllBoards(user.uid);
                setAllBoards(boards);

                // Get the open board
                const openBoard = getOpenBoard(boards);
                if (!openBoard) {
                    console.error("No board found for user");
                    setNodes(initialNodes);
                    setEdges(initialEdges);
                    return;
                }

                setCurrentBoard(openBoard);

                // Fetch nodes and edges from the open board
                const [nodesData, edgesData] = await Promise.all([
                    fetchNodesFromBoard(openBoard.id),
                    fetchEdgesFromBoard(openBoard.id),
                ]);

                setNodes(nodesData);
                setEdges(edgesData);
            } catch (error) {
                console.error("Error loading initial data:", error);
                setNodes(initialNodes);
                setEdges(initialEdges);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [user, setNodes, setEdges]);

    useEffect(() => {
        if (!isLoading && currentBoard && nodes.length > 0) {
            const saveTimeout = setTimeout(() => {
                saveNodesToBoard(currentBoard.id, nodes);
            }, 1000);

            return () => clearTimeout(saveTimeout);
        }
    }, [nodes, isLoading, currentBoard]);

    useEffect(() => {
        if (!isLoading && currentBoard && edges.length > 0) {
            const saveTimeout = setTimeout(() => {
                saveEdgesToBoard(currentBoard.id, edges);
            }, 1000);

            return () => clearTimeout(saveTimeout);
        }
    }, [edges, isLoading, currentBoard]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <>
            {!user ? (
                <AuthWindow onAuthed={onAuthed} />
            ) : (
                <>
                    <SideBar
                        allBoards={allBoards}
                        currentBoard={currentBoard}
                        onSwitchBoard={switchToBoard}
                        onCreateBoard={createNewBoard}
                        onSignOut={handleSignOut}
                    />
                    <TopBar
                        name={currentBoard?.name || "Loading..."}
                        onSetName={SetNewBoardName}
                        user={user}
                    />
                    <div style={{ width: "100vw", height: "100vh" }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            connectionMode={ConnectionMode.Loose}
                            fitView
                        >
                            <Controls />
                            <MiniMap />
                            <Background variant="dots" gap={12} size={1} />
                        </ReactFlow>
                    </div>
                </>
            )}
        </>
    );
}

export default App;
