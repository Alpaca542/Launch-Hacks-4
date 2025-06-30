import { useState } from "react";
import BoardNameModal from "./BoardNameModal";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface BoardData {
    id: string;
    userId: string;
    name: string;
    createdAt: any;
    isOpen: boolean;
    isFallback?: boolean;
}

interface SideBarProps {
    allBoards: BoardData[];
    currentBoard: BoardData | null;
    onSwitchBoard: (boardId: string) => void;
    onCreateBoard: (boardName?: string) => Promise<void>;
    onDeleteBoard: (boardId: string) => void;
    onSignOut: () => void;
    isLoading: boolean;
    isCollapsed?: boolean;
    onToggleSidebar?: () => void;
    // Explanation mode props
    mode?: "boards" | "explanation";
    onModeChange?: (mode: "boards" | "explanation") => void;
    explanation?: {
        title: string;
        text: string;
    } | null;
}

function SideBar({
    allBoards,
    currentBoard,
    onSwitchBoard,
    onCreateBoard,
    onDeleteBoard,
    onSignOut,
    isLoading,
    isCollapsed = false,
    onToggleSidebar,
    mode = "boards",
    onModeChange,
    explanation,
}: SideBarProps) {
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const [showBoardNameModal, setShowBoardNameModal] = useState(false);

    const handleCreateBoard = async (boardName: string) => {
        try {
            setIsCreatingBoard(true);
            await onCreateBoard(boardName);
            setShowBoardNameModal(false);
        } catch (error) {
            console.error("Error in sidebar create board:", error);
        } finally {
            setIsCreatingBoard(false);
        }
    };

    const handleShowModal = () => {
        setShowBoardNameModal(true);
    };

    const handleHideModal = () => {
        setShowBoardNameModal(false);
    };

    const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
        e.stopPropagation(); // Prevent board switching when deleting
        if (window.confirm("Are you sure you want to delete this board?")) {
            onDeleteBoard(boardId);
        }
    };

    return (
        <>
            <div className="sidebar split-pane-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-mode-switch">
                        <button
                            className={`mode-switch-btn ${
                                mode === "boards" ? "active" : ""
                            }`}
                            onClick={() =>
                                onModeChange && onModeChange("boards")
                            }
                        >
                            📋 Boards
                        </button>
                        <button
                            className={`mode-switch-btn ${
                                mode === "explanation" ? "active" : ""
                            }`}
                            onClick={() =>
                                onModeChange && onModeChange("explanation")
                            }
                        >
                            📄 Explanation
                        </button>
                    </div>
                </div>
                <div className="sidebar-content">
                    {mode === "boards" ? (
                        // Board management mode
                        <>
                            <div className="boards-section-header">
                                <button
                                    onClick={handleShowModal}
                                    disabled={isLoading || isCreatingBoard}
                                    className="new-board-btn"
                                >
                                    {isCreatingBoard
                                        ? "Creating..."
                                        : "+ New Board"}
                                </button>
                            </div>
                            <ul>
                                {allBoards?.map((board) => {
                                    return (
                                        <li
                                            key={board.id}
                                            onClick={() =>
                                                !isLoading &&
                                                onSwitchBoard(board.id)
                                            }
                                            className={
                                                currentBoard?.id === board.id
                                                    ? "active"
                                                    : ""
                                            }
                                        >
                                            <span className="board-name">
                                                {board.name}
                                            </span>
                                            <div className="board-actions">
                                                {board.isOpen && (
                                                    <span className="open-indicator">
                                                        ●
                                                    </span>
                                                )}
                                                {allBoards.length > 1 && (
                                                    <button
                                                        className="delete-btn"
                                                        onClick={(e) =>
                                                            handleDeleteBoard(
                                                                e,
                                                                board.id
                                                            )
                                                        }
                                                        title="Delete board"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {isLoading && (
                                <div className="loading-indicator">
                                    Loading boards...
                                </div>
                            )}
                            <div className="sidebar-footer">
                                <button onClick={onSignOut}>Sign Out</button>
                            </div>
                        </>
                    ) : (
                        // Explanation mode
                        <div className="explanation-content">
                            {explanation ? (
                                <>
                                    <div className="explanation-header">
                                        <h3>{explanation.title}</h3>
                                    </div>
                                    <div className="explanation-text">
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeRaw]}
                                        >
                                            {explanation.text}
                                        </ReactMarkdown>
                                    </div>
                                </>
                            ) : (
                                <div className="explanation-placeholder">
                                    <p>
                                        Click on a node's explanation button
                                        (📄) to view its detailed information
                                        here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <BoardNameModal
                show={showBoardNameModal}
                onHide={handleHideModal}
                onConfirm={handleCreateBoard}
                isCreating={isCreatingBoard}
            />
        </>
    );
}

export default SideBar;
