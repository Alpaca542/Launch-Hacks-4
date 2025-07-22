import React, { useState, useEffect } from "react";
import { History, MessageCircle, Clock, User as UserIcon } from "lucide-react";
import {
    getChatSessions,
    getChatHistory,
    ChatSession,
    ChatMessage,
} from "../services/chatService";
import { useAuth } from "../hooks/useAuth";

interface ChatHistoryProps {
    className?: string;
    currentBoardId?: string; // Add current board prop to show current board's chat
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
    className = "",
    currentBoardId,
}) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadChatSessions();
    }, [user]);

    // Load current board's chat history automatically if available
    useEffect(() => {
        if (currentBoardId && !selectedBoardId) {
            loadChatMessages(currentBoardId);
        }
    }, [currentBoardId]);

    const loadChatSessions = async () => {
        setLoading(true);
        try {
            const chatSessions = await getChatSessions(user?.uid);
            setSessions(chatSessions);
            console.log("📚 Loaded chat sessions:", chatSessions.length);
        } catch (error) {
            console.error("Error loading chat sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadChatMessages = async (boardId: string) => {
        setLoading(true);
        try {
            const chatMessages = await getChatHistory(boardId); // Use boardId instead of sessionId
            setMessages(chatMessages);
            setSelectedBoardId(boardId); // Use setSelectedBoardId
            console.log("💬 Loaded chat messages:", chatMessages.length);
        } catch (error) {
            console.error("Error loading chat messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Unknown";
        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    const goBack = () => {
        setSelectedBoardId(null); // Use setSelectedBoardId
        setMessages([]);
    };

    if (selectedBoardId) {
        // Use selectedBoardId
        return (
            <div className={`flex flex-col h-full ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-purple-200 dark:border-purple-800">
                    {selectedBoardId !== currentBoardId && (
                        <button
                            onClick={goBack}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-2"
                        >
                            ← Back to Sessions
                        </button>
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                        {selectedBoardId === currentBoardId
                            ? "Current Board Chat"
                            : "Chat Messages"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Board ID: {selectedBoardId}
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-start gap-3 ${
                                message.role === "user"
                                    ? "flex-row-reverse"
                                    : ""
                            }`}
                        >
                            {/* Avatar */}
                            <div
                                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    message.role === "user"
                                        ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                                        : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                                }`}
                            >
                                {message.role === "user" ? (
                                    <UserIcon className="w-3 h-3" />
                                ) : (
                                    <MessageCircle className="w-3 h-3" />
                                )}
                            </div>

                            {/* Message */}
                            <div
                                className={`flex-1 ${
                                    message.role === "user" ? "text-right" : ""
                                }`}
                            >
                                <div
                                    className={`inline-block px-3 py-2 rounded-lg text-sm ${
                                        message.role === "user"
                                            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatDate(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {messages.length === 0 && !loading && (
                        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No messages in this conversation</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-purple-200 dark:border-purple-800">
                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Chat History
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    View your previous conversations
                </p>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p>Loading chat history...</p>
                    </div>
                )}

                {!loading && sessions.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                            No Chat History
                        </p>
                        <p className="text-sm">
                            Start a conversation to see your chat history here
                        </p>
                    </div>
                )}

                {!loading && sessions.length > 0 && (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() =>
                                    loadChatMessages(session.boardId!)
                                } // Use session.boardId instead of session.id
                                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition-colors duration-200"
                            >
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                                    {session.title}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        <span>
                                            {session.messageCount || 0} messages
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatDate(session.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && sessions.length > 0 && (
                    <button
                        onClick={loadChatSessions}
                        className="w-full mt-4 px-4 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded-lg transition-colors duration-200"
                    >
                        Refresh
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatHistory;
