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
            <div className="sidebar split-pane-sidebar bg-gray-900 dark:bg-gray-950 border-r border-gray-700 dark:border-gray-800">
                <div className="flex flex-col h-full p-4">
                    {/* Header */}
                    <div className="py-2 text-right">
                        <button
                            onClick={handleShowModal}
                            disabled={isLoading || isCreatingBoard}
                            className={`px-3 py-1.5 rounded border transition-all duration-150 
                                ${
                                    isLoading || isCreatingBoard
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer hover:bg-blue-600 hover:border-blue-400"
                                }
                                border-blue-500 bg-gray-800 dark:bg-gray-900 
                                text-blue-400 dark:text-blue-400
                                dark:border-blue-500`}
                        >
                            {isCreatingBoard ? "Creating..." : "+ New Board"}
                        </button>
                    </div>

                    {/* Boards list */}
                    <div className="flex flex-col gap-2 mt-2 overflow-y-auto flex-grow">
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
                                    className={`
                                        min-h-[54px] px-5 py-3.5 mx-2 rounded-lg flex justify-between items-center
                                        transition-all duration-150 cursor-pointer
                                        ${
                                            isLoading
                                                ? "cursor-not-allowed"
                                                : "cursor-pointer"
                                        }
                                        ${
                                            isActive
                                                ? "border-2 border-blue-500 bg-blue-900/30 dark:bg-blue-900/40 text-white dark:text-white font-semibold shadow-lg shadow-blue-500/20"
                                                : isHovered
                                                ? "border border-gray-500 dark:border-gray-600 bg-gray-800 dark:bg-gray-800 text-gray-300 dark:text-gray-300 shadow-sm shadow-black/20 -translate-y-0.5"
                                                : "border border-gray-700 dark:border-gray-700 bg-gray-850 dark:bg-gray-850 text-gray-400 dark:text-gray-400"
                                        }
                                    `}
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
                                        className={`
                                        ${
                                            isActive
                                                ? "font-bold"
                                                : "font-medium"
                                        } 
                                        text-lg flex-1 whitespace-nowrap overflow-hidden text-ellipsis 
                                        tracking-wide leading-5
                                    `}
                                    >
                                        {board.name}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {board.isOpen && (
                                            <span className="text-blue-400 dark:text-blue-400 text-lg">
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
                                                className={`
                                                    bg-transparent border-none text-red-400 dark:text-red-400 
                                                    cursor-pointer text-xl leading-none px-1 transition-opacity duration-150
                                                    ${
                                                        isHovered
                                                            ? "opacity-100 visible"
                                                            : "opacity-0 invisible"
                                                    }
                                                    hover:text-red-300 dark:hover:text-red-300
                                                `}
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
                        <div className="p-4 text-center text-gray-500 dark:text-gray-500">
                            Loading boards...
                        </div>
                    )}

                    {/* Footer */}
                    <div className="py-3">
                        <button
                            onClick={onSignOut}
                            className="px-3 py-1.5 rounded border border-gray-700 dark:border-gray-600 
                                     bg-transparent text-gray-300 dark:text-gray-300 cursor-pointer
                                     hover:bg-gray-700 dark:hover:bg-gray-700
                                     hover:border-gray-600 dark:hover:border-gray-500
                                     transition-all duration-150"
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
