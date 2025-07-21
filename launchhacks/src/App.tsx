import { useState, useCallback, useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
    Connection,
    BackgroundVariant,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { handleTokenClick } from "./contexts/TokenInteractionContext";

// Components
import AuthWindow from "./components/AuthWindow";
import SideBar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";
import LandingPage from "./components/LandingPage";
import "./index.css"; // Ensure this is imported for styles
import TempInputNode from "./components/TempInputNode";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useNotifications } from "./hooks/useNotifications";

// Configuration
import { nodeTypes as baseNodeTypes } from "./config/nodeTypes";

const nodeTypes = {
    ...baseNodeTypes,
    tempInput: TempInputNode,
};

// Context
import { TokenInteractionProvider } from "./contexts/TokenInteractionContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function AppContent() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Authentication
    const { user, signOut } = useAuth();

    // Notifications
    const {
        notifications,
        removeNotification,
        showSuccess,
        showError,
        showInfo,
    } = useNotifications();

    // Board Management
    const {
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
    } = useBoardManagement(user, { showSuccess, showError, showInfo });

    // // Handle sign out with state cleanup
    const handleSignOut = async () => {
        await signOut();
        clearBoardState();
    };
    // Handle sign in state

    const handleSignIn = () => {
        setIsLoggingIn(true);
    };

    // ReactFlow connection handler
    const onConnect = useCallback(
        (params: Connection) => {
            // Create the new edge and pass it as an add change
            const newEdge = {
                id: `e${params.source}-${params.target}`,
                source: params.source!,
                target: params.target!,
                sourceHandle: params.sourceHandle,
                targetHandle: params.targetHandle,
            };
            onEdgesChange([{ type: "add", item: newEdge }]);
        },
        [onEdgesChange]
    );
    // Handle node creation callback
    const handleNodeCallback = useCallback(
        (
            _nodeId: string,
            _data: any,
            mode?: string,
            parent?: string,
            position?: { x: number; y: number }
        ) => {
            if (!mode || !position) {
                console.warn(
                    "handleNodeCallback called without mode or position",
                    mode,
                    position
                );
                return;
            }

            const id = `temp-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

            setNodes((prev) => [
                ...prev,
                {
                    id,
                    type: "tempInput",
                    position: { x: position.x - 80, y: position.y - 40 },
                    data: { mode: mode, parent: parent },
                },
            ]);
            const colorSceheme = {
                default: "#FFFFFF", // blue-600 hex
                explain: "#3b82f6", // blue-600 hex
                answer: "#10b981", // emerald-600 hex
                argue: "#fb7185", // rose-600 hex
            };

            const color =
                colorSceheme[
                    (mode as keyof typeof colorSceheme) in colorSceheme
                        ? (mode as keyof typeof colorSceheme)
                        : "default"
                ];

            if (parent) {
                onEdgesChange([
                    {
                        type: "add",
                        item: {
                            id: `e${parent}-${id}`,
                            source: parent,
                            target: id,
                            sourceHandle: mode,
                            style: {
                                stroke: color, // blue-600 hex
                                strokeWidth: 3,
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: color, // blue-600 hex
                            },
                        },
                    },
                ]);
            }
        },
        [setNodes]
    );

    // Inject callback into all nodes' data
    const nodesWithCallback = useMemo(() => {
        return nodes.map((node) => {
            let data = { ...node.data };
            // Inject onNodeCallback as before
            data.onNodeCallback = (
                mode?: string,
                parent?: string,
                position?: { x: number; y: number }
            ) => handleNodeCallback(node.id, node.data, mode, parent, position);
            // If this is a tempInput node, inject onSubmit callback
            if (node.type === "tempInput") {
                data.onSubmit = (value: string) => {
                    setNodes((nodes) =>
                        nodes.map((n) =>
                            n.id === node.id
                                ? {
                                      ...n,
                                      type: "draggableEditable",
                                      data: { ...n.data, label: value },
                                  }
                                : n
                        )
                    );
                    const parentNode = nodes.find(
                        (n) => n.id === node.data.parent
                    );
                    const parentColor = parentNode?.data?.color;
                    const parentText = parentNode?.data?.label;
                    const token = { word: value };
                    const sourceNodeId = node.data.parent;
                    const sourceNodePosition = {
                        x: node.position.x,
                        y: node.position.y,
                    };
                    const sourceNodeType = "draggableEditable";
                    const isInput = true;
                    const suggestionID = undefined;

                    const color = handleTokenClick(
                        token,
                        sourceNodeId,
                        sourceNodePosition,
                        sourceNodeType,
                        nodes,
                        setNodes,
                        onNodesChange,
                        onEdgesChange,
                        parentColor,
                        parentText,
                        suggestionID,
                        isInput,
                        node,
                        node.data.mode
                    );
                    // Update the node's color
                    setNodes((nodes) =>
                        nodes.map((n) =>
                            n.id === node.id
                                ? {
                                      ...n,
                                      data: { ...n.data, myColor: color },
                                  }
                                : n
                        )
                    );
                    // Update the edge's color if parent exists
                    if (node.data.parent) {
                        if (!color) return; // or handle fallback here
                        setEdges((edges) =>
                            edges.map((e) =>
                                e.id === `e${node.data.parent}-${node.id}`
                                    ? {
                                          ...e,
                                          style: {
                                              ...(e.style || {}),
                                              stroke: color,
                                              strokeWidth: 3,
                                          },
                                          markerEnd: {
                                              type: MarkerType.ArrowClosed,
                                              color: color,
                                          },
                                      }
                                    : e
                            )
                        );
                    }
                };
            }
            return {
                ...node,
                data,
            };
        });
    }, [nodes, handleNodeCallback, setNodes]);

    const ReactFlowComponent = useMemo(
        () => (
            <ReactFlow
                nodes={nodesWithCallback}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="bg-gray-50 dark:bg-gray-900 w-full h-full"
            >
                <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                <Background
                    variant={BackgroundVariant.Cross}
                    gap={30}
                    size={10}
                    lineWidth={0.5}
                    color="#94a3b8"
                    className="bg-gray-50 dark:bg-gray-900"
                />
            </ReactFlow>
        ),
        [nodesWithCallback, edges, onNodesChange, onEdgesChange, onConnect]
    );

    // Render authentication screen if not logged in
    if (!user) {
        if (isLoggingIn) {
            return <AuthWindow />;
        } else {
            return <LandingPage onLogin={handleSignIn} />;
        }
    }

    // Main application interface
    return (
        <div
            className="bg-gray-50 dark:bg-gray-900 relative"
            style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
        >
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
            />
            <div style={{ height: "100%", position: "relative" }}>
                {/* Simple flex layout */}
                <PanelGroup direction="horizontal">
                    {/* Left Panel - Sidebar */}
                    <Panel defaultSize={15} minSize={10} maxSize={30}>
                        <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                            <SideBar
                                allBoards={allBoards}
                                currentBoard={currentBoard}
                                onSwitchBoard={switchToBoard}
                                onCreateBoard={async (boardName?: string) => {
                                    await createNewBoard(boardName);
                                }}
                                onDeleteBoard={deleteBoard}
                                onSignOut={handleSignOut}
                                isLoading={isSwitchingBoard}
                            />
                        </div>
                    </Panel>
                    <PanelResizeHandle />
                    {/* Main Content Panel */}
                    <Panel>
                        <div
                            className="bg-white dark:bg-gray-800"
                            style={{ height: "100%", position: "relative" }}
                        >
                            <TopBar
                                name={currentBoard?.name || "Loading..."}
                                onSetName={updateBoardName}
                                user={user}
                                isSaving={isSaving}
                            />

                            <div
                                className="bg-gray-50 dark:bg-gray-900"
                                style={{
                                    height: "calc(100% - 60px)",
                                    width: "100%",
                                }}
                            >
                                <TokenInteractionProvider
                                    nodes={nodes}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    setNodes={setNodes}
                                >
                                    {ReactFlowComponent}
                                </TokenInteractionProvider>
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
