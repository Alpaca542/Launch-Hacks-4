import { useState, useCallback, useMemo, memo } from "react";
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

// Components
import AuthWindow from "./components/AuthWindow";
import SideBar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";
import LandingPage from "./components/LandingPage";
import RightSidePanel from "./components/RightSidePanel";
import FloatingChatButton from "./components/SimpleFloatingChatButton";
import { ActivityTracker } from "./components/ActivityTracker";
import "./index.css";
import TempInputNode from "./components/TempInputNode";
import { handleNodeCreation } from "./contexts/TokenInteractionContext";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useNotifications } from "./hooks/useNotifications";

// Configuration
import { nodeTypes as baseNodeTypes } from "./config/nodeTypes";

// Context
import { NodeCreationProvider } from "./contexts/TokenInteractionContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function AppContent() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [chosenNode, setChosenNode] = useState<string | null>(null);
    // Authentication
    const { user, signOut } = useAuth();

    // Memoize nodeTypes to prevent recreation on every render
    const nodeTypes = useMemo(
        () => ({
            ...baseNodeTypes,
            tempInput: TempInputNode,
        }),
        []
    );

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
        saveNewNodeContent,
        performPeriodicSave,
        getLastTwoLayouts,
        addLayout,
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
            suggestion?: string,
            parent?: string,
            position?: { x: number; y: number },
            extraData?: {
                initialText?: string;
                isQuizMode?: boolean;
                isDragConent?: boolean;
            }
        ) => {
            if (!suggestion || !position) {
                console.warn(
                    "handleNodeCallback called without suggestion or position",
                    suggestion,
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
                    data: {
                        label: suggestion,
                        parent: parent,
                        isQuizMode: extraData?.isQuizMode || false,
                        isDragConent: extraData?.isDragConent || false,
                    },
                },
            ]);
            const color = extraData?.isQuizMode ? "#65a30d" : "#3b82f6";
            if (parent) {
                onEdgesChange([
                    {
                        type: "add",
                        item: {
                            id: `e${parent}-${id}`,
                            source: parent,
                            target: id,
                            sourceHandle: extraData?.isQuizMode
                                ? null
                                : suggestion,
                            style: { stroke: color, strokeWidth: 3 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: color,
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
            data.onNodeCallback = (
                suggestion?: string,
                parent?: string,
                position?: { x: number; y: number },
                extraData?: { initialText?: string; isQuizMode?: boolean }
            ) =>
                handleNodeCallback(
                    node.id,
                    node.data,
                    suggestion,
                    parent,
                    position,
                    extraData
                );
            data.chosen = chosenNode === node.id;
            data.onChoose = () => {
                console.log("Node chosen:", node.id);
                setChosenNode(node.id);
            };
            data.onQuizCreate = (topic: string, srcID?: string) => {
                setNodes((nodes) =>
                    nodes.map((n) =>
                        n.id === node.id
                            ? {
                                  ...n,
                                  type: "draggableEditable",
                                  data: { ...n.data, label: " Quiz: " + topic },
                              }
                            : n
                    )
                );
                const parentNode = nodes.find((n) => n.id === node.data.parent);
                const parentColor = parentNode?.data?.color;
                const parentText = parentNode?.data?.label;
                const sourceNodeId = node.data.parent;
                const sourceNodePosition = {
                    x: node.position.x,
                    y: node.position.y,
                };
                const sourceNodeType = "draggableEditable";
                const isAIGenerated = false;
                const suggestionID = undefined;

                const color = handleNodeCreation(
                    topic,
                    sourceNodeId,
                    sourceNodePosition,
                    sourceNodeType,
                    nodes,
                    setNodes,
                    onNodesChange,
                    onEdgesChange,
                    node.data.mode,
                    node,
                    isAIGenerated,
                    parentColor,
                    parentText,
                    suggestionID,
                    saveNewNodeContent,
                    getLastTwoLayouts,
                    addLayout,
                    undefined,
                    true // isQuiz
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
                                          sourceHandle: srcID,
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

            // If this is a tempInput node, inject onSubmit callback
            if (node.type === "tempInput") {
                data.onNodeCallback = (value: string, _mode: string) => {
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
                    const sourceNodeId = node.data.parent;
                    const sourceNodePosition = {
                        x: node.position.x,
                        y: node.position.y,
                    };
                    const sourceNodeType = "draggableEditable";
                    const isAIGenerated = false;
                    const suggestionID = undefined;

                    const color = handleNodeCreation(
                        value,
                        sourceNodeId,
                        sourceNodePosition,
                        sourceNodeType,
                        nodes,
                        setNodes,
                        onNodesChange,
                        onEdgesChange,
                        node.data.mode,
                        node,
                        isAIGenerated,
                        parentColor,
                        parentText,
                        suggestionID,
                        saveNewNodeContent,
                        getLastTwoLayouts,
                        addLayout
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
                minZoom={0.1}
                className="bg-gray-50 dark:bg-gray-900 w-full h-full"
            >
                <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                <Background
                    variant={BackgroundVariant.Cross}
                    gap={50}
                    size={12}
                    lineWidth={0.5}
                    color="#737373"
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
                                <NodeCreationProvider
                                    nodes={nodes}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    setNodes={setNodes}
                                    saveCallback={saveNewNodeContent}
                                    getLastTwoLayouts={getLastTwoLayouts}
                                    addLayout={addLayout}
                                >
                                    {ReactFlowComponent}
                                </NodeCreationProvider>
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>

            {/* Activity Tracker for periodic saves */}
            {user && (
                <ActivityTracker
                    onPeriodicSave={performPeriodicSave}
                    saveInterval={20000} // 20 seconds
                />
            )}

            {/* Unified Right Side Panel */}
            <RightSidePanel
                isOpen={showChat || showRightPanel}
                onClose={() => {
                    setShowChat(false);
                    setShowRightPanel(false);
                }}
                currentBoardId={currentBoard?.id}
                currentBoardName={currentBoard?.name}
                nodes={nodes}
                setNodes={setNodes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                getLastTwoLayouts={getLastTwoLayouts}
                addLayout={addLayout}
                chosenNodeText={
                    chosenNode
                        ? nodes.find((n) => n.id === chosenNode)?.data.label ||
                          ""
                        : ""
                }
            />

            {/* Floating AI Chat Button */}
            <FloatingChatButton
                onClick={() => setShowChat(true)}
                isOpen={showChat || showRightPanel}
            />
        </div>
    );
}

const MemoAppContent = memo(AppContent);

function App() {
    return (
        <ThemeProvider>
            <MemoAppContent />
        </ThemeProvider>
    );
}

export default App;
