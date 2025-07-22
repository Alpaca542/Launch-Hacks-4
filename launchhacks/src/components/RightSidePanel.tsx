import React from "react";
import { X } from "lucide-react";

interface RightSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({
    isOpen,
    onClose,
    title = "Side Panel",
    children,
}) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300"
                    onClick={onClose}
                />
            )}

            {/* Side Panel */}
            <div
                className={`
                fixed top-0 right-0 h-full w-80 
                bg-white dark:bg-gray-900
                border-l border-purple-200 dark:border-purple-800
                shadow-2xl shadow-purple-500/20 dark:shadow-purple-500/10
                z-50
                transform transition-all duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "translate-x-full"}
            `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-purple-100 to-indigo-50 dark:from-purple-900/30 dark:via-purple-800/30 dark:to-indigo-900/30">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-all duration-200 text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300 group"
                    >
                        <X className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/20">
                    {children}
                </div>
            </div>
        </>
    );
};

export default RightSidePanel;
