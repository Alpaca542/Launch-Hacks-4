import { useCallback } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ConnectionMode,
    Connection,
    BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import "./styles/dark-theme.css";

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
        <div className="app-container">
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
            <div className="main-layout">
                <TopBar
                    name={currentBoard?.name || "Loading..."}
                    onSetName={updateBoardName}
                    user={user}
                    isSaving={isSaving}
                />
                <div className="main-content">
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
                            <MiniMap />
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={16}
                                size={1}
                            />
                        </ReactFlow>
                    </TokenInteractionProvider>
                </div>
            </div>
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
            />
        </div>
    );
}

function App() {
    return <AppContent />;
}

export default App;
