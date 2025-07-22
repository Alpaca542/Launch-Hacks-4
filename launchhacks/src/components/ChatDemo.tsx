import React, { useState } from "react";
import { MessageCircle, History } from "lucide-react";
import RightSidePanel from "./RightSidePanel";
import SimpleChat from "./SimpleChat";
import ChatHistory from "./ChatHistory";

const ChatDemo: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");

    // TODO: This should be replaced with actual current board from useBoardManagement
    // For now, we'll pass placeholder values
    const currentBoardId = "demo_board_123";
    const currentBoardName = "Demo Board";

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 p-8">
            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
                        AI Chat System Demo
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                        Experience real-time streaming AI conversations
                    </p>

                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Open AI Chat
                    </button>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Real-time Streaming
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Watch AI responses appear in real-time with smooth
                            streaming
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                            <div className="w-6 h-6 bg-white rounded-full"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Modern UI
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Beautiful chat interface with dark mode support
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                            <div className="w-6 h-6 bg-white rounded-sm"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Firebase Powered
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Powered by Firebase Cloud Functions with OpenAI
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        How to Use
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                        <li>
                            Click the "Open AI Chat" button to open the chat
                            panel
                        </li>
                        <li>
                            Type your message in the input field at the bottom
                        </li>
                        <li>Press Enter to send your message</li>
                        <li>Watch as the AI response streams in real-time</li>
                        <li>
                            Use Shift+Enter to add line breaks in your messages
                        </li>
                    </ol>
                </div>
            </div>

            {/* Chat Side Panel */}
            <RightSidePanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                title="AI Assistant"
            >
                {/* Tabs */}
                <div className="flex border-b border-purple-200 dark:border-purple-800 mb-4">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                            activeTab === "chat"
                                ? "text-purple-700 dark:text-purple-300 border-b-2 border-purple-500"
                                : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                        }`}
                    >
                        <MessageCircle className="w-4 h-4 inline mr-1" />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                            activeTab === "history"
                                ? "text-purple-700 dark:text-purple-300 border-b-2 border-purple-500"
                                : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                        }`}
                    >
                        <History className="w-4 h-4 inline mr-1" />
                        History
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "chat" && (
                    <SimpleChat
                        className="flex-1"
                        currentBoardId={currentBoardId}
                        currentBoardName={currentBoardName}
                    />
                )}
                {activeTab === "history" && (
                    <ChatHistory
                        className="flex-1"
                        currentBoardId={currentBoardId}
                    />
                )}
            </RightSidePanel>

            {/* Toggle Button (when panel is closed) */}
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed top-1/2 right-4 z-30 p-3 rounded-l-lg bg-gradient-to-b from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-white group"
                    title="Open AI Chat"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                </button>
            )}
        </div>
    );
};

export default ChatDemo;
