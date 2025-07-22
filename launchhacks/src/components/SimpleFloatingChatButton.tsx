import React from "react";
import { MessageSquare } from "lucide-react";

interface FloatingChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
    onClick,
    isOpen,
}) => {
    if (isOpen) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            title="Open AI Assistant"
        >
            <MessageSquare className="w-5 h-5" />
        </button>
    );
};

export default FloatingChatButton;
