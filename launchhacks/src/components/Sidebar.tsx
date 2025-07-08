import { useState } from "react";
import BoardNameModal from "./BoardNameModal";

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
    const [showBoardNameModal, setShowBoardNameModal] = useState(false);
    const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);

    /* --------------------  Shared inline style helpers -------------------- */
    const baseItemStyle = {
        minHeight: 54,
        padding: "14px 20px",
        margin: "0 8px",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition:
            "background 0.15s, border 0.15s, box-shadow 0.15s, transform 0.15s",
    };

    const getItemStyle = (isActive: boolean, isHovered: boolean) => ({
        ...baseItemStyle,
        cursor: isLoading ? "not-allowed" : "pointer",
        border: isActive
            ? "2px solid #4f8cff"
            : isHovered
            ? "1px solid #555"
            : "1px solid #333",
        background: isActive ? "#25304a" : isHovered ? "#23293a" : "#181c24",
        color: isActive ? "#fff" : "#cfd8dc",
        fontWeight: isActive ? 600 : 400,
        boxShadow: isActive
            ? "0 2px 8px 0 #4f8cff22"
            : isHovered
            ? "0 1px 4px 0 #00000033"
            : "none",
        transform: isHovered ? "translateY(-1px)" : "none",
    });

    const actionBtnBase = {
        background: "none",
        border: "none",
        color: "#ff4d4d",
        cursor: "pointer",
        fontSize: "1.2em",
        lineHeight: 1,
        padding: "0 5px",
        transition: "opacity 0.15s",
    };

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
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        padding: "16px",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "8px 0",
                            textAlign: "right",
                        }}
                    >
                        <button
                            onClick={handleShowModal}
                            disabled={isLoading || isCreatingBoard}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid #4f8cff",
                                background: "#1d2330",
                                color: "#4f8cff",
                                cursor:
                                    isLoading || isCreatingBoard
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            {isCreatingBoard ? "Creating..." : "+ New Board"}
                        </button>
                    </div>

                    {/* Boards list */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 8,
                            overflowY: "auto",
                            flexGrow: 1,
                        }}
                    >
                        {allBoards.map((board) => {
                            const isActive = currentBoard?.id === board.id;
                            const isHovered = hoveredBoardId === board.id;
                            return (
                                <div
                                    key={board.id}
                                    onClick={() =>
                                        !isLoading && onSwitchBoard(board.id)
                                    }
                                    onMouseEnter={() =>
                                        setHoveredBoardId(board.id)
                                    }
                                    onMouseLeave={() => setHoveredBoardId(null)}
                                    style={getItemStyle(isActive, isHovered)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (
                                            (e.key === "Enter" ||
                                                e.key === " ") &&
                                            !isLoading
                                        ) {
                                            onSwitchBoard(board.id);
                                        }
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: isActive ? 700 : 500,
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
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        {board.isOpen && (
                                            <span
                                                style={{
                                                    color: "#4f8cff",
                                                    fontSize: "1.1em",
                                                }}
                                            >
                                                ●
                                            </span>
                                        )}

                                        {allBoards.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBoard(
                                                        e,
                                                        board.id
                                                    );
                                                }}
                                                title="Delete board"
                                                style={{
                                                    ...actionBtnBase,
                                                    opacity: isHovered ? 1 : 0,
                                                    visibility: isHovered
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

                    {/* Loading indicator */}
                    {isLoading && (
                        <div
                            style={{
                                padding: 16,
                                textAlign: "center",
                                color: "#9e9e9e",
                            }}
                        >
                            Loading boards...
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ padding: "12px 0" }}>
                        <button
                            onClick={onSignOut}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid #333",
                                background: "transparent",
                                color: "#cfd8dc",
                                cursor: "pointer",
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
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
