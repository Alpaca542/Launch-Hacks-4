import { useState } from "react";
import { Handle, Position } from "reactflow";
import "./EditableNode.css";

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
    onCreateBoard: () => Promise<void>;
    onDeleteBoard: (boardId: string) => void;
    onSignOut: () => void;
    isLoading: boolean;
}

function SideBar({
    allBoards,
    currentBoard,
    onSwitchBoard,
    onCreateBoard,
    onDeleteBoard,
    onSignOut,
    isLoading,
}: SideBarProps) {
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);

    const handleCreateBoard = async () => {
        try {
            setIsCreatingBoard(true);
            await onCreateBoard();
        } catch (error) {
            console.error("Error in sidebar create board:", error);
        } finally {
            setIsCreatingBoard(false);
        }
    };

    const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
        e.stopPropagation(); // Prevent board switching when deleting
        if (window.confirm("Are you sure you want to delete this board?")) {
            onDeleteBoard(boardId);
        }
    };

    return (
        <>
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Launch Hacks</h2>
                    <button
                        onClick={handleCreateBoard}
                        disabled={isLoading || isCreatingBoard}
                        style={{
                            opacity: isLoading || isCreatingBoard ? 0.6 : 1,
                            cursor:
                                isLoading || isCreatingBoard
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {isCreatingBoard ? "Creating..." : "+ New Board"}
                    </button>
                </div>
                <div className="sidebar-content">
                    {isLoading && (
                        <div className="loading-indicator">
                            Switching boards...
                        </div>
                    )}
                    <div
                        style={{
                            padding: "10px",
                            fontSize: "12px",
                            color: "#666",
                        }}
                    >
                        Boards: {allBoards?.length || 0}
                    </div>
                    <ul>
                        {allBoards?.map((board) => {
                            console.log("Rendering board:", board);
                            return (
                                <li
                                    key={board.id}
                                    onClick={() =>
                                        !isLoading && onSwitchBoard(board.id)
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
                </div>
                <div className="sidebar-footer">
                    <button onClick={onSignOut}>Sign Out</button>
                </div>
            </div>
        </>
    );
}

export default SideBar;
