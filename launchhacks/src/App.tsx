import { useState, useCallback, useMemo, memo } from "react";
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
    Connection,
    BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Resizable } from "re-resizable";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

// Components
import AuthWindow from "./components/AuthWindow";
import SideBar from "./components/Sidebar";
import ExplanationSidebar from "./components/ExplanationSidebar";
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";
import LandingPage from "./components/LandingPage";
import "./index.css"; // Ensure this is imported for styles
// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useNotifications } from "./hooks/useNotifications";

// Configuration
import { nodeTypes } from "./config/nodeTypes";

// Context
import { TokenInteractionProvider } from "./contexts/TokenInteractionContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Memoized explanation sidebar container
const MemoizedExplanationSidebar = memo(function MemoizedExplanationSidebar({
    isVisible,
    explanation,
    onClose,
}: {
    isVisible: boolean;
    explanation: { title: string; text: string } | null;
    onClose: () => void;
}) {
    if (!isVisible) return null;

    return (
        <Resizable
            defaultSize={{
                width: 380,
            }}
            style={{
                background: "transparent",
                position: "fixed",
                right: "12px",
                top: "80px",
                borderRadius: "16px",
                zIndex: 1000,
            }}
            enable={{
                right: false,
                top: false,
                bottom: false,
                left: true,
            }}
        >
            <div className="relative z-10 overflow-auto h-full">
                <ExplanationSidebar
                    explanation={explanation}
                    onClose={onClose}
                    isVisible={isVisible}
                />
            </div>
        </Resizable>
    );
});

function AppContent() {
    // Explanation sidebar state
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [currentExplanation, setCurrentExplanation] = useState<{
        title: string;
        text: string;
    } | null>(null);
    const [inputNodeMode, setInputNodeMode] = useState<string>("");
    // Optimized explanation handlers
    const showExplanation = useCallback((title: string, text: string) => {
        setCurrentExplanation({ title, text });
        setIsExplanationVisible(true);
    }, []);

    const closeExplanation = useCallback(() => {
        setIsExplanationVisible(false);
    }, []);

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
    const onInputFinished = (value: string) => {
        // Handle input submission logic here
    };
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
        switchToBoard,
        createNewBoard,
        deleteBoard,
        updateBoardName,
        clearBoardState,
    } = useBoardManagement(
        user,
        { showSuccess, showError, showInfo },
        onInputFinished
    );

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
    const showInputNode = (show: boolean, mode: string) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === "hidden_input" ? { ...node, hidden: show } : node
            )
        );
        setInputNodeMode(mode);
    };
    const ReactFlowComponent = useMemo(
        () => (
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes((show: boolean, value: string) => {
                    showInputNode(show, value);
                })}
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
        [nodes, edges, onNodesChange, onEdgesChange, onConnect]
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
                                    showExplanation={showExplanation}
                                >
                                    {ReactFlowComponent}
                                </TokenInteractionProvider>
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>

                {/* Right Panel - Explanation Sidebar (conditionally rendered) */}
                <MemoizedExplanationSidebar
                    isVisible={isExplanationVisible}
                    explanation={currentExplanation}
                    onClose={closeExplanation}
                />
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
