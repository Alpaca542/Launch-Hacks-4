import { useCallback, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    ConnectionMode,
    Connection,
    BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

// Components
import AuthWindow from "./components/AuthWindow";
import SideBar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import NotificationContainer from "./components/NotificationContainer";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useBoardManagement } from "./hooks/useBoardManagement";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNotifications } from "./hooks/useNotifications";

// Configuration
import { nodeTypes } from "./config/nodeTypes";

// Context
import { TokenInteractionProvider } from "./contexts/TokenInteractionContext";

function AppContent() {
    // Sidebar state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        switchToBoard,
        createNewBoard,
        deleteBoard,
        updateBoardName,
        clearBoardState,
    } = useBoardManagement(user, { showSuccess, showError, showInfo });

    // Keyboard shortcuts
    useKeyboardShortcuts({
        allBoards,
        currentBoard,
        createNewBoard,
        switchToBoard,
    });

    // // Handle sign out with state cleanup
    const handleSignOut = async () => {
        await signOut();
        clearBoardState();
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
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

    // Render authentication screen if not logged in
    if (!user) {
        return <AuthWindow />;
    }

    // Main application interface
    return (
        <>
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
                isCollapsed={sidebarCollapsed}
                onToggleSidebar={toggleSidebar}
            />
            <TopBar
                name={currentBoard?.name || "Loading..."}
                onSetName={updateBoardName}
                user={user}
                isSaving={isSaving}
                sidebarCollapsed={sidebarCollapsed}
            />
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
            />
            <div
                className={`reactflow-board-container ${
                    sidebarCollapsed ? "sidebar-collapsed" : "with-sidebar"
                }`}
            >
                <TokenInteractionProvider
                    nodes={nodes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
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
                            gap={12}
                            size={1}
                        />
                    </ReactFlow>
                </TokenInteractionProvider>
            </div>
        </>
    );
}

function App() {
    return <AppContent />;
}

export default App;
