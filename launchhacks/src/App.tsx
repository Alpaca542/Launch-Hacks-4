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
import "./App.css";

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
import { ModeProvider, useMode } from "./contexts/ModeContext";

function AppContent() {
    // Authentication
    const { user, signOut } = useAuth();

    // Mode context
    const { mode, toggleMode } = useMode();

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
        <>
            <SideBar
                allBoards={allBoards}
                currentBoard={currentBoard}
                onSwitchBoard={switchToBoard}
                onCreateBoard={() => {
                    createNewBoard();
                    return Promise.resolve();
                }}
                onDeleteBoard={deleteBoard}
                onSignOut={handleSignOut}
                isLoading={isSwitchingBoard}
            />
            <TopBar
                name={currentBoard?.name || "Loading..."}
                onSetName={updateBoardName}
                user={user}
                isSaving={isSaving}
                isConceptMode={mode === "concept"}
                onToggleMode={toggleMode}
            />
            <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
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
                    <Background
                        variant={BackgroundVariant.Cross}
                        gap={12}
                        size={1}
                    />
                </ReactFlow>
            </div>
        </>
    );
}

function App() {
    return (
        <ModeProvider>
            <AppContent />
        </ModeProvider>
    );
}

export default App;
