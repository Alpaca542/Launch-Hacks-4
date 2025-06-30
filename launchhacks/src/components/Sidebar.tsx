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
    const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);

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
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    marginTop: 8,
                                }}
                            >
                                {allBoards?.map((board) => {
                                    const isActive =
                                        currentBoard?.id === board.id;
                                    const isHovered =
                                        hoveredBoardId === board.id;
                                    return (
                                        <div
                                            key={board.id}
                                            onClick={() =>
                                                !isLoading &&
                                                onSwitchBoard(board.id)
                                            }
                                            className={isActive ? "active" : ""}
                                            style={{
                                                minHeight: "54px",
                                                padding: "14px 20px",
                                                margin: "0 8px",
                                                borderRadius: 10,
                                                cursor: isLoading
                                                    ? "not-allowed"
                                                    : "pointer",
                                                border: isActive
                                                    ? "2px solid #4f8cff"
                                                    : isHovered
                                                    ? "1px solid #555"
                                                    : "1px solid #333",
                                                background: isActive
                                                    ? "#25304a"
                                                    : isHovered
                                                    ? "#23293a"
                                                    : "#181c24",
                                                color: isActive
                                                    ? "#fff"
                                                    : "#cfd8dc",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                boxShadow: isActive
                                                    ? "0 2px 8px 0 #4f8cff22"
                                                    : isHovered
                                                    ? "0 1px 4px 0 #00000033"
                                                    : "none",
                                                fontWeight: isActive
                                                    ? 600
                                                    : 400,
                                                transform: isHovered
                                                    ? "translateY(-1px)"
                                                    : "none",
                                                transition:
                                                    "background 0.15s, border 0.15s, box-shadow 0.15s, transform 0.15s",
                                            }}
                                            onMouseEnter={() =>
                                                setHoveredBoardId(board.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredBoardId(null)
                                            }
                                        >
                                            <span
                                                className="board-name"
                                                style={{
                                                    fontWeight: isActive
                                                        ? 700
                                                        : 500,
                                                    fontSize: "1.1em",
                                                    flex: 1,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    letterSpacing: "0.2px",
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {board.name}
                                            </span>
                                            <div
                                                className="board-actions"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                {board.isOpen && (
                                                    <span
                                                        className="open-indicator"
                                                        style={{
                                                            color: "#4f8cff",
                                                            fontSize: "1.1em",
                                                            marginRight: 2,
                                                        }}
                                                    >
                                                        ●
                                                    </span>
                                                )}
                                                {allBoards.length > 1 && (
                                                    <button
                                                        className="delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteBoard(
                                                                e,
                                                                board.id
                                                            );
                                                        }}
                                                        title="Delete board"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#ff4d4d",
                                                            cursor: "pointer",
                                                            fontSize: "1.2em",
                                                            lineHeight: "1",
                                                            padding: "0 5px",
                                                            opacity: isHovered
                                                                ? 1
                                                                : 0,
                                                            transition:
                                                                "opacity 0.15s",
                                                            visibility:
                                                                isHovered
                                                                    ? "visible"
                                                                    : "hidden",
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
