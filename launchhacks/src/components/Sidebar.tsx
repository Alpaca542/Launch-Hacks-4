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
            <div className="left-0 top-0 w-[100%] h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="m-0 mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                            TinkFlow Boards
                        </h2>
                        <button
                            onClick={handleShowModal}
                            disabled={isLoading || isCreatingBoard}
                            className={`w-full bg-blue-600 dark:bg-blue-600 text-white dark:text-white border border-blue-600 dark:border-blue-600 
                                      px-3 py-2 rounded-lg cursor-pointer text-base font-medium transition-all duration-200 
                                      ${
                                          isLoading || isCreatingBoard
                                              ? "cursor-not-allowed opacity-60"
                                              : "hover:bg-blue-700 dark:hover:bg-blue-700 hover:border-blue-700 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-md"
                                      }`}
                        >
                            {isCreatingBoard ? "Creating..." : "+ New Board"}
                        </button>
                    </div>

                    {/* Boards list */}
                    <div className="flex-1 overflow-y-auto p-2">
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
                                        min-h-[44px] px-3 py-2.5 mb-1 rounded-lg flex justify-between items-center
                                        transition-all duration-200 cursor-pointer border font-medium text-lg leading-tight
                                        ${
                                            isLoading
                                                ? "cursor-not-allowed opacity-60"
                                                : "cursor-pointer"
                                        }
                                        ${
                                            isActive
                                                ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold shadow-sm"
                                                : isHovered
                                                ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 shadow-sm"
                                                : "border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30"
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
                                                ? "font-semibold"
                                                : "font-medium"
                                        } 
                                        flex-1 whitespace-nowrap overflow-hidden text-ellipsis 
                                        text-lg leading-tight
                                    `}
                                    >
                                        {board.name}
                                    </span>

                                    <div className="flex items-center gap-1 ml-2">
                                        {board.isOpen && (
                                            <span className="text-green-500 dark:text-green-400 text-base">
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
                                                    w-5 h-5 bg-transparent border-none text-red-500 dark:text-red-400 
                                                    cursor-pointer text-lg leading-none flex items-center justify-center
                                                    rounded transition-all duration-150
                                                    ${
                                                        isHovered
                                                            ? "opacity-100 visible hover:bg-red-50 dark:hover:bg-red-900/30"
                                                            : "opacity-0 invisible"
                                                    }
                                                    hover:text-red-600 dark:hover:text-red-300
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
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-base font-medium">
                            Loading boards...
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onSignOut}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     bg-transparent text-gray-700 dark:text-gray-300 cursor-pointer text-base font-medium
                                     transition-all duration-200
                                     hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 
                                     hover:text-gray-900 dark:hover:text-gray-100"
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
