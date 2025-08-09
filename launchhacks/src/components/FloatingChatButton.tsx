import React, { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";

interface FloatingChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
    onClick,
    isOpen,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    if (isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {/* Floating Button */}
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95"
            >
                {/* Animated background pulse */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse opacity-30 scale-110"></div>

                {/* Icon */}
                <div className="relative z-10">
                    <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                </div>

                {/* Floating sparkles */}
                <div className="absolute -top-1 -right-1 w-4 h-4">
                    <Sparkles
                        className="w-3 h-3 text-yellow-400 animate-bounce"
                        style={{ animationDelay: "0.5s" }}
                    />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4">
                    <Sparkles
                        className="w-3 h-3 text-blue-300 animate-bounce"
                        style={{ animationDelay: "1s" }}
                    />
                </div>
            </button>

            {/* Tooltip */}
            <div
                className={`absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isHovered
                        ? "opacity-100 transform translate-y-0"
                        : "opacity-0 transform translate-y-2 pointer-events-none"
                }`}
            >
                AI Assistant
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
            </div>

            {/* Notification dot (can be used to show active conversations) */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold opacity-0 scale-0 transition-all duration-200">
                1
            </div>
        </div>
    );
};

export default FloatingChatButton;
