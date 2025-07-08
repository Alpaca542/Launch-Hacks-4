import { useState } from "react";

interface BoardNameModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: (boardName: string) => void;
    isCreating?: boolean;
}

function BoardNameModal({
    show,
    onHide,
    onConfirm,
    isCreating = false,
}: BoardNameModalProps) {
    const [boardName, setBoardName] = useState<string>("");
    const [isValid, setIsValid] = useState<boolean>(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBoardName(value);
        setIsValid(value.trim().length > 0 && value.trim().length <= 50);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = boardName.trim();

        if (trimmedName.length > 0 && trimmedName.length <= 50) {
            onConfirm(trimmedName);
            setBoardName("");
            setIsValid(true);
        }
    };

    const handleHide = () => {
        setBoardName("");
        setIsValid(true);
        onHide();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit(e as any);
        }
    };

    if (!show) return null;

    return (
        <div className="board-name-modal fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[2001]">
            <div className="bg-gray-800 dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700 dark:border-gray-600">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white dark:text-white">
                        Create New Board
                    </h3>
                    <button
                        onClick={handleHide}
                        className="text-gray-400 dark:text-gray-400 hover:text-gray-200 dark:hover:text-gray-200 
                                 bg-gray-700/50 dark:bg-gray-800/50 hover:bg-gray-600/50 dark:hover:bg-gray-700/50
                                 border border-gray-600 dark:border-gray-700 rounded-lg w-8 h-8 flex items-center justify-center
                                 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                            Board Name
                        </label>
                        <input
                            type="text"
                            value={boardName}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Enter board name..."
                            maxLength={50}
                            autoFocus
                            className={`w-full px-4 py-3 bg-gray-700/50 dark:bg-gray-800/50 border rounded-lg 
                                       text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 
                                       transition-all duration-200 font-medium
                                       ${
                                           !isValid
                                               ? "border-red-500/60 dark:border-red-500/60 focus:border-red-500/60 dark:focus:border-red-500/60"
                                               : "border-gray-600/50 dark:border-gray-700/50 focus:border-blue-500/60 dark:focus:border-blue-400/60"
                                       }`}
                        />
                        {!isValid && (
                            <p className="text-red-400 dark:text-red-400 text-sm mt-2">
                                Board name must be between 1 and 50 characters
                                long.
                            </p>
                        )}
                        <p
                            className={`text-xs mt-1 ${
                                boardName.length === 50
                                    ? "text-red-400 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-500"
                            }`}
                        >
                            {boardName.length}/50 characters
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleHide}
                            disabled={isCreating}
                            className="flex-1 px-4 py-3 bg-gray-700/50 dark:bg-gray-800/50 border border-gray-600/50 dark:border-gray-700/50
                                     text-gray-300 dark:text-gray-300 rounded-lg font-medium transition-all duration-200
                                     hover:bg-gray-600/60 dark:hover:bg-gray-700/60 hover:border-gray-500/60 dark:hover:border-gray-600/60
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     focus:outline-none focus:ring-2 focus:ring-gray-500/20 dark:focus:ring-gray-400/20"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                !isValid ||
                                boardName.trim().length === 0 ||
                                isCreating
                            }
                            className="flex-1 px-4 py-3 bg-blue-600/80 dark:bg-blue-500/80 border border-blue-500/50 dark:border-blue-400/50
                                     text-white rounded-lg font-medium transition-all duration-200 
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     hover:bg-blue-500/90 dark:hover:bg-blue-400/90 hover:border-blue-400/60 dark:hover:border-blue-300/60
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40"
                        >
                            {isCreating ? "Creating..." : "Create Board"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BoardNameModal;
