import { useCallback, useState } from "react";
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
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useNotifications } from "./hooks/useNotifications";

// Configuration
import { nodeTypes } from "./config/nodeTypes";

// Context
import { TokenInteractionProvider } from "./contexts/TokenInteractionContext";

function AppContent() {
    // Sidebar state
    const [sidebarMode, setSidebarMode] = useState<"boards" | "explanation">(
        "boards"
    );
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

    // Handle explanation display
    const showExplanation = useCallback((title: string, text: string) => {
        setCurrentExplanation({ title, text });
        setSidebarMode("explanation");
    }, []);

    // Handle sidebar mode change
    const handleSidebarModeChange = useCallback(
        (mode: "boards" | "explanation") => {
            setSidebarMode(mode);
        },
        []
    );

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

    // Render authentication screen if not logged in
    if (!user) {
        return <AuthWindow />;
    }

    // Main application interface
    return (
        <div className="app-layout" style={{ height: "100vh", width: "100vw" }}>
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
            />
            <div style={{ height: "100%" }}>
                <Allotment defaultSizes={[420, 1000]}>
                    {/* Left Pane - Sidebar */}
                    <Allotment.Pane minSize={240} maxSize={860}>
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
                            mode={sidebarMode}
                            onModeChange={handleSidebarModeChange}
                            explanation={currentExplanation}
                        />
                    </Allotment.Pane>

                    {/* Right Pane - Main Content */}
                    <Allotment.Pane>
                        <div
                            className="main-content-pane"
                            style={{ height: "100%" }}
                        >
                            <TopBar
                                name={currentBoard?.name || "Loading..."}
                                onSetName={updateBoardName}
                                user={user}
                                isSaving={isSaving}
                                sidebarCollapsed={false} // Always visible in split pane
                            />
                            <div
                                className="reactflow-container"
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
            </div>
        </div>
    );
}

function App() {
    return <AppContent />;
}

export default App;
