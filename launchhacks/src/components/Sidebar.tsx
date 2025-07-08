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
            <div className="fixed left-0 top-0 w-[440px] h-screen bg-[#222226] dark:bg-[#222226] border-r border-white/10 dark:border-white/10 flex flex-col z-[1001] transition-transform duration-[0.35s] ease-[cubic-bezier(0.4,0,0.2,1)]">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-[22px] border-b border-white/[0.08] dark:border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03]">
                        <h2 className="m-0 mb-[18px] text-[18px] font-semibold text-[#f8faff] dark:text-[#f8faff] tracking-[-0.012em]">
                            TinkFlow Boards
                        </h2>
                        <button
                            onClick={handleShowModal}
                            disabled={isLoading || isCreatingBoard}
                            className={`w-full bg-[#2f2f33] dark:bg-[#2f2f33] text-[#f8faff] dark:text-[#f8faff] border border-white/12 dark:border-white/12 
                                      px-4 py-[10px] rounded-md cursor-pointer text-[13px] font-semibold transition-all duration-200 
                                      tracking-[0.015em] uppercase
                                      ${
                                          isLoading || isCreatingBoard
                                              ? "cursor-not-allowed opacity-60"
                                              : "hover:bg-[#3a3a3e] dark:hover:bg-[#3a3a3e] hover:border-white/18 dark:hover:border-white/18 hover:-translate-y-0.5"
                                      }`}
                        >
                            {isCreatingBoard ? "Creating..." : "+ New Board"}
                        </button>
                    </div>

                    {/* Boards list */}
                    <div className="flex-1 overflow-y-auto p-[14px] scrollbar-thin scrollbar-track-[#2a2a2e] scrollbar-thumb-[#4a4a4e] hover:scrollbar-thumb-[#5a5a5e]">
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
                                        min-h-[54px] px-[18px] py-[14px] mb-[8px] rounded-[12px] flex justify-between items-center
                                        transition-all duration-200 cursor-pointer border font-medium text-[14px] leading-[1.4]
                                        ${
                                            isLoading
                                                ? "cursor-not-allowed opacity-60"
                                                : "cursor-pointer"
                                        }
                                        ${
                                            isActive
                                                ? "border-[#4a90e2] bg-[#2a3850] dark:bg-[#2a3850] text-[#f8faff] dark:text-[#f8faff] font-semibold shadow-[0_2px_8px_rgba(74,144,226,0.3)] transform translate-y-[-1px]"
                                                : isHovered
                                                ? "border-white/20 dark:border-white/20 bg-[#2a2a2e] dark:bg-[#2a2a2e] text-[#e8eaed] dark:text-[#e8eaed] shadow-[0_2px_8px_rgba(0,0,0,0.3)] transform translate-y-[-1px]"
                                                : "border-white/10 dark:border-white/10 bg-[#1e1e22] dark:bg-[#1e1e22] text-[#b0b3b8] dark:text-[#b0b3b8]"
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
                        <div className="p-4 text-center text-[#b0b3b8] dark:text-[#b0b3b8] text-[13px] font-medium">
                            Loading boards...
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-[22px] border-t border-white/[0.08] dark:border-white/[0.08]">
                        <button
                            onClick={onSignOut}
                            className="w-full px-4 py-[10px] rounded-md border border-white/12 dark:border-white/12 
                                     bg-transparent text-[#b0b3b8] dark:text-[#b0b3b8] cursor-pointer text-[13px] font-semibold
                                     transition-all duration-200 tracking-[0.015em] uppercase
                                     hover:bg-[#2a2a2e] dark:hover:bg-[#2a2a2e] hover:border-white/18 dark:hover:border-white/18 
                                     hover:text-[#e8eaed] dark:hover:text-[#e8eaed] hover:-translate-y-0.5"
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
