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
import { MessageCircle } from "lucide-react";
import { handleTokenClick } from "./contexts/TokenInteractionContext";

// Components
import AuthWindow from "./components/AuthWindow";
import SideBar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";
import LandingPage from "./components/LandingPage";
import { CacheDebugPanel } from "./components/CacheDebugPanel";
import RightSidePanel from "./components/RightSidePanel";
import SimpleChat from "./components/SimpleChat";
import "./index.css"; // Ensure this is imported for styles
import TempInputNode from "./components/TempInputNode";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useNotifications } from "./hooks/useNotifications";
import { useLayoutHistory } from "./hooks/useLayoutHistory";

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
    const [showCacheDebug, setShowCacheDebug] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [showChat, setShowChat] = useState(false);

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

    // Layout History Tracking
    const { addLayout, getLastTwoLayouts, clearHistory } = useLayoutHistory(
        user?.uid
    );

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
    } = useBoardManagement(user, { showSuccess, showError, showInfo });

    // // Handle sign out with state cleanup
    const handleSignOut = async () => {
        await signOut();
        clearBoardState();
        clearHistory(); // Clear layout history on sign out
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
            position?: { x: number; y: number }
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
                    data: { label: suggestion, parent: parent },
                },
            ]);

            const color = "#3b82f6";

            if (parent) {
                onEdgesChange([
                    {
                        type: "add",
                        item: {
                            id: `e${parent}-${id}`,
                            source: parent,
                            target: id,
                            sourceHandle: suggestion,
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
            data.onNodeCallback = (
                suggestion?: string,
                parent?: string,
                position?: { x: number; y: number }
            ) =>
                handleNodeCallback(
                    node.id,
                    node.data,
                    suggestion,
                    parent,
                    position
                );
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
                        node.data.mode,
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
                                    saveCallback={saveNewNodeContent}
                                    getLastTwoLayouts={getLastTwoLayouts}
                                    addLayout={addLayout}
                                >
                                    {ReactFlowComponent}
                                </TokenInteractionProvider>
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>

            {/* Cache Debug Panel - only show in development */}
            {true && (
                <CacheDebugPanel
                    isVisible={showCacheDebug}
                    onToggle={() => setShowCacheDebug(!showCacheDebug)}
                />
            )}

            {/* Right Side Panel */}
            <RightSidePanel
                isOpen={showRightPanel}
                onClose={() => setShowRightPanel(false)}
                title="Panel"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                            Sample Content
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This is your right side panel. You can add any
                            content here.
                        </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Settings
                        </h4>
                        <div className="space-y-2">
                            <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-800/30 rounded-md transition-colors duration-200 text-purple-700 dark:text-purple-300">
                                Option 1
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-800/30 rounded-md transition-colors duration-200 text-purple-700 dark:text-purple-300">
                                Option 2
                            </button>
                        </div>
                    </div>
                </div>
            </RightSidePanel>

            {/* Toggle Button for Right Panel */}
            {!showRightPanel && (
                <button
                    onClick={() => setShowRightPanel(true)}
                    className="fixed top-1/2 right-4 z-30 p-3 rounded-l-lg bg-gradient-to-b from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-white group"
                    title="Open Panel"
                >
                    <div className="w-1 h-6 bg-white rounded-full group-hover:scale-x-150 transition-transform duration-200"></div>
                </button>
            )}

            {/* AI Chat Side Panel */}
            <RightSidePanel
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                title="AI Chat Assistant"
            >
                <SimpleChat
                    className="h-full"
                    currentBoardId={currentBoard?.id}
                    currentBoardName={currentBoard?.name}
                    nodes={nodes}
                    setNodes={setNodes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    getLastTwoLayouts={getLastTwoLayouts}
                    addLayout={addLayout}
                />
            </RightSidePanel>

            {/* Chat Toggle Button */}
            {!showChat && !showRightPanel && (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-6 right-6 z-30 p-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-white group"
                    title="Open AI Chat"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                </button>
            )}
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
