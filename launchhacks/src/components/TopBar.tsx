import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

interface User {
    isAnonymous?: boolean;
    email?: string | null;
}

interface TopBarProps {
    name: string;
    onSetName: (name: string) => void;
    user: User | null;
    isSaving: boolean;
}

function TopBar({ name, onSetName, user, isSaving }: TopBarProps) {
    const [edit, setEdit] = useState(false);
    const [editedName, setEditedName] = useState(name || "");

    // Update editedName when name prop changes
    useEffect(() => {
        setEditedName(name || "");
    }, [name]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            onSetName(editedName);
            setEdit(false);
        }
    };

    const handleClick = () => {
        setEdit(true);
        setEditedName(name || "");
    };

    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-none mx-auto px-4">
                <header className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    T
                                </span>
                            </div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                TinkFlow
                            </h1>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                            •
                        </span>
                        {!edit ? (
                            <button
                                onClick={handleClick}
                                className="bg-transparent border-none text-gray-600 dark:text-gray-400 text-sm cursor-pointer 
                                         px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {name || "Untitled Board"}
                            </button>
                        ) : (
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                                         rounded-md px-2 py-1 text-gray-900 dark:text-gray-100 text-sm min-w-[120px]
                                         focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                                autoFocus
                                onKeyDown={handleKeyPress}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isSaving && (
                            <div
                                className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2 
                                           bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full"
                            >
                                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                <span className="font-medium">Saving...</span>
                            </div>
                        )}
                        <ThemeToggle />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                    {user?.isAnonymous
                                        ? "G"
                                        : user?.email
                                              ?.charAt(0)
                                              .toUpperCase() || "U"}
                                </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                {user?.isAnonymous
                                    ? "Guest"
                                    : user?.email?.split("@")[0] || "User"}
                            </p>
                        </div>
                    </div>
                </header>
            </div>
        </div>
    );
}

export default TopBar;
