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
        <div className="board-name-modal fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2001]">
            <div className="bg-gray-800 dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-full max-w-md border border-gray-700 dark:border-gray-600">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white dark:text-white">
                        Create New Board
                    </h3>
                    <button
                        onClick={handleHide}
                        className="text-gray-400 dark:text-gray-400 hover:text-gray-200 dark:hover:text-gray-200 
                                 bg-transparent border-none text-xl cursor-pointer p-1 rounded transition-colors duration-150"
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
                            className={`w-full px-3 py-2 bg-gray-700 dark:bg-gray-800 border rounded-lg 
                                       text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-400 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 
                                       transition-all duration-200
                                       ${
                                           !isValid
                                               ? "border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500"
                                               : "border-gray-600 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                       }`}
                        />
                        {!isValid && (
                            <p className="text-red-400 dark:text-red-400 text-sm mt-1">
                                Board name must be between 1 and 50 characters
                                long.
                            </p>
                        )}
                        <p
                            className={`text-sm mt-1 ${
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
                            className="flex-1 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-gray-200 dark:text-gray-200 
                                     rounded-lg font-medium transition-all duration-200
                                     hover:bg-gray-500 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
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
                            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium 
                                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                     hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none 
                                     focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
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
