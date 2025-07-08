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
    // Explanation sidebar state with localStorage persistence
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [explanationWidth, setExplanationWidth] = useState(() => {
        const saved = localStorage.getItem("explanationSidebarWidth");
        return saved ? parseInt(saved) : 650; // Default to 650px for better reading
    });
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

    // Handle width changes and persist to localStorage
    const handleWidthChange = (newWidth: number) => {
        setExplanationWidth(newWidth);
        localStorage.setItem("explanationSidebarWidth", newWidth.toString());
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
        <div
            className="app-layout bg-gray-900 dark:bg-gray-950"
            style={{ height: "100vh", width: "100vw" }}
        >
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
            />
            <div
                className="bg-gray-900 dark:bg-gray-950"
                style={{ height: "100%", position: "relative" }}
            >
                {/* Main layout: Left sidebar + Main content */}
                <Allotment defaultSizes={[280, 1000]}>
                    {/* Left Pane - Board Sidebar */}
                    <Allotment.Pane minSize={200} maxSize={500}>
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
                    </Allotment.Pane>

                    {/* Main Content Area */}
                    <Allotment.Pane>
                        <div
                            className="main-content-pane bg-gray-800 dark:bg-gray-900"
                            style={{ height: "100%", position: "relative" }}
                        >
                            <TopBar
                                name={currentBoard?.name || "Loading..."}
                                onSetName={updateBoardName}
                                user={user}
                                isSaving={isSaving}
                            />

                            <div
                                className="reactflow-container bg-gray-800 dark:bg-gray-900"
                                style={{ height: "calc(100% - 56px)" }}
                            >
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
                                    >
                                        <Controls />
                                        <Background
                                            variant={BackgroundVariant.Cross}
                                            gap={30}
                                            size={10}
                                            lineWidth={0.5}
                                            color="#616161"
                                        />
                                    </ReactFlow>
                                </TokenInteractionProvider>
                            </div>
                        </div>
                    </Allotment.Pane>
                </Allotment>

                {/* Professional Black Theme Explanation Panel */}
                {isExplanationVisible && (
                    <>
                        {/* Floating Panel Container */}
                        <div
                            className="explanation-panel-floating bg-gray-900 dark:bg-gray-950 border-l border-gray-700 dark:border-gray-800"
                            style={{
                                position: "fixed",
                                top: "0",
                                right: "0",
                                width: `${explanationWidth}px`,
                                maxWidth: "50vw",
                                minWidth: "420px",
                                height: "100vh",
                                zIndex: 1000,
                                pointerEvents: "auto",
                            }}
                        >
                            {/* Left Resize Handle */}
                            <div
                                className="panel-resize-handle"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    const startX = e.clientX;
                                    const startWidth = explanationWidth;

                                    const handleMouseMove = (e: MouseEvent) => {
                                        const deltaX = startX - e.clientX;
                                        const newWidth = Math.max(
                                            420,
                                            Math.min(
                                                window.innerWidth * 0.5,
                                                startWidth + deltaX
                                            )
                                        );
                                        handleWidthChange(newWidth);
                                    };

                                    const handleMouseUp = () => {
                                        document.removeEventListener(
                                            "mousemove",
                                            handleMouseMove
                                        );
                                        document.removeEventListener(
                                            "mouseup",
                                            handleMouseUp
                                        );
                                        document.body.style.cursor = "default";
                                        document.body.style.userSelect = "auto";
                                    };

                                    document.addEventListener(
                                        "mousemove",
                                        handleMouseMove
                                    );
                                    document.addEventListener(
                                        "mouseup",
                                        handleMouseUp
                                    );
                                    document.body.style.cursor = "ew-resize";
                                    document.body.style.userSelect = "none";
                                }}
                            />

                            {/* Panel Content */}
                            <div className="panel-main-content h-full">
                                <ExplanationSidebar
                                    explanation={currentExplanation}
                                    onClose={closeExplanation}
                                    isVisible={isExplanationVisible}
                                />
                            </div>
                        </div>
                    </>
                )}
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
