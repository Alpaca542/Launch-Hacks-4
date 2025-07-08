import { useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
    Connection,
    BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

// Components
import AuthWindow from "./components/AuthWindow";
import SideBar from "./components/Sidebar";
import ExplanationSidebar from "./components/ExplanationSidebar";
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";
import LandingPage from "./components/LandingPage";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useNotifications } from "./hooks/useNotifications";

// Configuration
import { nodeTypes } from "./config/nodeTypes";

// Context
import { TokenInteractionProvider } from "./contexts/TokenInteractionContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function AppContent() {
    // Explanation sidebar state
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [currentExplanation, setCurrentExplanation] = useState<{
        title: string;
        text: string;
    } | null>(null);

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

    // Handle explanation display
    const showExplanation = (title: string, text: string) => {
        setCurrentExplanation({ title, text });
        setIsExplanationVisible(true);
    };

    // Handle explanation sidebar close
    const closeExplanation = () => {
        setIsExplanationVisible(false);
    };

    // ReactFlow connection handler
    const onConnect = (params: Connection) => {
        // Create the new edge and pass it as an add change
        const newEdge = {
            id: `e${params.source}-${params.target}`,
            source: params.source!,
            target: params.target!,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
        };
        onEdgesChange([{ type: "add", item: newEdge }]);
    };

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
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 relative">
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
            />

            {/* Main layout: Left sidebar + Central board (managed together with Allotment) */}
            <div className="h-full w-full flex">
                <Allotment defaultSizes={[300, 1000]} className="h-full w-full">
                    {/* Left Pane - Board Sidebar */}
                    <Allotment.Pane minSize={250} maxSize={600}>
                        <div className="h-full w-full bg-gray-900 dark:bg-gray-950">
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
                    </Allotment.Pane>

                    {/* Central Board Area - Always full width of available space */}
                    <Allotment.Pane>
                        <div className="bg-white dark:bg-gray-800 h-full flex flex-col w-full">
                            <TopBar
                                name={currentBoard?.name || "Loading..."}
                                onSetName={updateBoardName}
                                user={user}
                                isSaving={isSaving}
                            />
                            <div className="flex-1 bg-gray-50 dark:bg-gray-900 w-full">
                                <TokenInteractionProvider
                                    nodes={nodes}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    setNodes={setNodes}
                                    showExplanation={showExplanation}
                                >
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        onConnect={onConnect}
                                        nodeTypes={nodeTypes}
                                        connectionMode={ConnectionMode.Loose}
                                        fitView
                                        className="bg-gray-50 dark:bg-gray-900 w-full h-full"
                                    >
                                        <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg" />
                                        <Background
                                            variant={BackgroundVariant.Cross}
                                            gap={30}
                                            size={10}
                                            lineWidth={0.5}
                                            color="#94a3b8"
                                            className="bg-gray-50 dark:bg-gray-900"
                                        />
                                    </ReactFlow>
                                </TokenInteractionProvider>
                            </div>
                        </div>
                    </Allotment.Pane>
                </Allotment>
            </div>

            {/* Independent Right-side Explanation Panel - Bubble-like design */}
            {isExplanationVisible && (
                <div
                    className="fixed top-4 right-4 h-[calc(100vh-2rem)] 
                               bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl
                               border border-gray-200/50 dark:border-gray-700/50 
                               rounded-3xl shadow-2xl z-50 
                               animate-in slide-in-from-right-5 fade-in duration-300
                               transition-all ease-out"
                    style={{ width: "28rem" }}
                >
                    <div className="h-full rounded-3xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                        <ExplanationSidebar
                            explanation={currentExplanation}
                            onClose={closeExplanation}
                            isVisible={isExplanationVisible}
                        />
                    </div>
                </div>
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
