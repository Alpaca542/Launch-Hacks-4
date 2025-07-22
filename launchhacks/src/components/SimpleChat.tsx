import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { askAIStream } from "../services/aiService";
import { saveChatConversation } from "../services/chatService";
import { useAuth } from "../hooks/useAuth";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

interface SimpleChatProps {
    className?: string;
    currentBoardId?: string; // Add currentBoardId prop
    currentBoardName?: string; // Add board name for display
}

const SimpleChat: React.FC<SimpleChatProps> = ({
    className = "",
    currentBoardId,
    currentBoardName = "Current Board",
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessageContent = input.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userMessageContent,
        };

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");
        setIsLoading(true);

        // Track the assistant's response content for saving
        let assistantResponseContent = "";

        try {
            await askAIStream(
                userMessageContent,
                // onChunk
                (chunk: string) => {
                    assistantResponseContent += chunk;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessage.id
                                ? { ...msg, content: msg.content + chunk }
                                : msg
                        )
                    );
                },
                // onComplete
                async () => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessage.id
                                ? { ...msg, isStreaming: false }
                                : msg
                        )
                    );
                    setIsLoading(false);

                    // Save the conversation to Firestore after stream completes
                    setIsSaving(true);
                    try {
                        if (currentBoardId) {
                            await saveChatConversation(
                                userMessageContent,
                                assistantResponseContent,
                                currentBoardId, // Use currentBoardId instead of sessionId
                                user?.uid
                            );
                            console.log(
                                "✅ Chat conversation saved successfully to Firestore"
                            );
                            console.log(`📊 Board ID: ${currentBoardId}`);
                            console.log(
                                `👤 User ID: ${user?.uid || "Anonymous"}`
                            );
                        } else {
                            console.warn(
                                "⚠️ No current board ID available, cannot save chat"
                            );
                        }
                    } catch (error) {
                        console.error(
                            "❌ Error saving chat conversation:",
                            error
                        );
                        // Don't show error to user as the chat functionality still works
                    } finally {
                        setIsSaving(false);
                    }
                },
                // onError
                (error: Error) => {
                    console.error("Streaming error:", error);
                    const errorMessage =
                        "Sorry, I encountered an error. Please try again.";
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessage.id
                                ? {
                                      ...msg,
                                      content: errorMessage,
                                      isStreaming: false,
                                  }
                                : msg
                        )
                    );
                    setIsLoading(false);

                    // Still save the conversation even if there was an error
                    // This helps track failed attempts
                    if (currentBoardId) {
                        saveChatConversation(
                            userMessageContent,
                            errorMessage,
                            currentBoardId, // Use currentBoardId instead of sessionId
                            user?.uid
                        ).catch((saveError) => {
                            console.error(
                                "Error saving failed chat conversation:",
                                saveError
                            );
                        });
                    }
                }
            );
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage =
                "Sorry, I encountered an error. Please try again.";
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessage.id
                        ? {
                              ...msg,
                              content: errorMessage,
                              isStreaming: false,
                          }
                        : msg
                )
            );
            setIsLoading(false);

            // Save the failed conversation
            if (currentBoardId) {
                saveChatConversation(
                    userMessageContent,
                    errorMessage,
                    currentBoardId, // Use currentBoardId instead of sessionId
                    user?.uid
                ).catch((saveError) => {
                    console.error(
                        "Error saving failed chat conversation:",
                        saveError
                    );
                });
            }
        }

        // Focus back to input
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                            Welcome to AI Chat
                        </p>
                        <p className="text-sm mb-2">
                            Ask me anything and I'll help you with streaming
                            responses!
                        </p>
                        {currentBoardId ? (
                            <div className="mt-4 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                    📋 Chat for: {currentBoardName}
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                    Your conversation will be saved with this
                                    board
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                    ⚠️ No board selected
                                </p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    Your conversation won't be saved without an
                                    active board
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                            message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                    >
                        {/* Avatar */}
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                message.role === "user"
                                    ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                                    : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                            }`}
                        >
                            {message.role === "user" ? (
                                <User className="w-4 h-4" />
                            ) : (
                                <Bot className="w-4 h-4" />
                            )}
                        </div>

                        {/* Message Content */}
                        <div
                            className={`flex-1 max-w-xs sm:max-w-md ${
                                message.role === "user" ? "text-right" : ""
                            }`}
                        >
                            <div
                                className={`inline-block px-4 py-2 rounded-lg ${
                                    message.role === "user"
                                        ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                                } relative`}
                            >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                    {message.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                                    )}
                                </p>
                            </div>

                            {message.role === "assistant" &&
                                message.isStreaming && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>AI is typing...</span>
                                    </div>
                                )}
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-purple-200 dark:border-purple-800 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-purple-200 dark:border-purple-700 rounded-lg 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 
                                 hover:from-purple-700 hover:to-indigo-700
                                 disabled:from-gray-400 disabled:to-gray-500
                                 text-white rounded-lg transition-all duration-200
                                 disabled:cursor-not-allowed flex items-center justify-center
                                 min-w-[44px]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </form>

                {/* Status indicators */}
                <div className="flex items-center justify-center mt-2 min-h-[20px]">
                    {isSaving && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving conversation...</span>
                        </div>
                    )}
                    {!isSaving && !isLoading && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Press Enter to send • Shift+Enter for new line
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimpleChat;
