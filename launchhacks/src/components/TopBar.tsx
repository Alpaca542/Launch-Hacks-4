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
        <>
            <div className="name bg-gray-900 dark:bg-gray-950 border-b border-gray-700 dark:border-gray-800">
                <div className="app-container max-w-7xl mx-auto px-4">
                    <header className="app-header flex justify-between items-center py-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        T
                                    </span>
                                </div>
                                <h1 className="text-xl font-bold text-white dark:text-white">
                                    TinkFlow
                                </h1>
                            </div>
                            <span className="text-slate-500 dark:text-slate-500 text-sm">
                                •
                            </span>
                            {!edit ? (
                                <button
                                    onClick={handleClick}
                                    className="bg-transparent border-none text-slate-400 dark:text-slate-400 text-sm cursor-pointer 
                                             px-2 py-1 rounded transition-all duration-150 ease-in-out
                                             hover:bg-white/5 dark:hover:bg-white/5 hover:text-slate-100 dark:hover:text-slate-100"
                                >
                                    {name || "Untitled Board"}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) =>
                                        setEditedName(e.target.value)
                                    }
                                    onKeyDown={handleKeyPress}
                                    onBlur={() => {
                                        onSetName(editedName);
                                        setEdit(false);
                                    }}
                                    className="bg-gray-800 dark:bg-gray-800 border border-white/20 dark:border-white/20 
                                             rounded px-2 py-1 text-slate-100 dark:text-slate-100 text-sm min-w-[120px]
                                             focus:outline-none focus:border-blue-400 dark:focus:border-blue-400"
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="user-info flex items-center gap-3">
                            <ThemeToggle />
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                {user?.isAnonymous
                                    ? "Guest"
                                    : user?.email?.split("@")[0] || "User"}
                            </p>
                            {isSaving && (
                                <div
                                    className="text-emerald-500 dark:text-emerald-400 text-sm flex items-center gap-2 
                                               bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-700/50
                                               animate-pulse"
                                >
                                    <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce"></div>
                                    <span className="font-medium">
                                        Saving...
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>
                </div>
            </div>
        </>
    );
}

export default TopBar;
