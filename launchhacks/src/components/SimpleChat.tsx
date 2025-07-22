import React, { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Loader2, User, Send } from "lucide-react";
import {
    askAIStream,
    NODE_CREATION_TOOLS,
    ToolCall,
} from "../services/aiService";
import { saveChatConversation } from "../services/chatService";
import { useAuth } from "../hooks/useAuth";
import { NodeCreationService } from "../services/nodeCreationService";
import { ToolExecutor } from "../services/toolExecutor";
import { Node } from "reactflow";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

interface SimpleChatProps {
    className?: string;
    currentBoardId?: string;
    currentBoardName?: string;
    // Node management props
    nodes?: Node[];
    setNodes?: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    onNodesChange?: (changes: any) => void;
    onEdgesChange?: (changes: any) => void;
    getLastTwoLayouts?: () => number[];
    addLayout?: (layout: number) => void;
}

const SimpleChat: React.FC<SimpleChatProps> = ({
    className = "",
    currentBoardId,
    currentBoardName = "Current Board",
    nodes = [],
    setNodes,
    onNodesChange,
    onEdgesChange,
    getLastTwoLayouts,
    addLayout,
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [enableTools, setEnableTools] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();

    // Create tool executor when node management props are available
    const toolExecutor = useMemo(() => {
        if (
            !setNodes ||
            !onNodesChange ||
            !onEdgesChange ||
            !getLastTwoLayouts ||
            !addLayout
        ) {
            return null;
        }

        const nodeCreationService = new NodeCreationService(
            nodes,
            setNodes,
            onNodesChange,
            onEdgesChange,
            getLastTwoLayouts,
            addLayout
        );

        return new ToolExecutor(nodeCreationService);
    }, [
        nodes,
        setNodes,
        onNodesChange,
        onEdgesChange,
        getLastTwoLayouts,
        addLayout,
    ]);

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

        // Tool call handler
        const handleToolCall = async (toolCall: ToolCall): Promise<string> => {
            if (!toolExecutor) {
                throw new Error(
                    "Node creation tools not available - missing board management"
                );
            }

            // Update the node creation service with current nodes
            toolExecutor.nodeCreationService.updateNodes(nodes);

            return await toolExecutor.executeTool(toolCall);
        };

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
                                currentBoardId,
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
                    if (currentBoardId) {
                        saveChatConversation(
                            userMessageContent,
                            errorMessage,
                            currentBoardId,
                            user?.uid
                        ).catch((saveError) => {
                            console.error(
                                "Error saving failed chat conversation:",
                                saveError
                            );
                        });
                    }
                },
                // options - enable tools if available
                {
                    enableTools: enableTools && !!toolExecutor,
                    availableTools: NODE_CREATION_TOOLS,
                    onToolCall: handleToolCall,
                    currentBoardId: currentBoardId,
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
                    currentBoardId,
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
                        {toolExecutor && (
                            <div className="mt-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                    🔧 Node Creation Tools Enabled
                                </p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                    I can create knowledge nodes, concept maps,
                                    and flowcharts for you!
                                </p>
                            </div>
                        )}
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
                        {/* Enhanced Avatar */}
                        <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                                message.role === "user"
                                    ? "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white"
                                    : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white"
                            }`}
                        >
                            {message.role === "user" ? (
                                <User className="w-5 h-5" />
                            ) : (
                                <Bot className="w-5 h-5" />
                            )}
                        </div>

                        {/* Message Content */}
                        <div
                            className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg ${
                                message.role === "user" ? "text-right" : ""
                            }`}
                        >
                            <div
                                className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${
                                    message.role === "user"
                                        ? "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white rounded-tr-md"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-tl-md"
                                } relative group`}
                            >
                                {/* Message Text */}
                                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {message.content}
                                    {message.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse rounded-sm" />
                                    )}
                                </div>
                            </div>

                            {message.role === "assistant" &&
                                message.isStreaming && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>AI is thinking...</span>
                                        </div>
                                        {toolExecutor && enableTools && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    Tools Ready
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-purple-200 dark:border-purple-800 p-4">
                {/* Tools Toggle */}
                {toolExecutor && (
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Node Creation Tools:
                            </span>
                            <button
                                onClick={() => setEnableTools(!enableTools)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                                    enableTools
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md"
                                        : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                                        enableTools
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                        {enableTools && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    Tools Active
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Input Area */}
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            rows={1}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl 
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     placeholder-gray-500 dark:placeholder-gray-400
                                     resize-none min-h-[50px] max-h-32
                                     shadow-sm transition-all duration-200"
                            style={{
                                height: "auto",
                                minHeight: "50px",
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height =
                                    Math.min(target.scrollHeight, 128) + "px";
                            }}
                        />

                        {/* Character counter for longer messages */}
                        {input.length > 100 && (
                            <div className="absolute bottom-1 right-14 text-xs text-gray-400">
                                {input.length}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleSubmit(e as any);
                        }}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 
                                 hover:from-purple-700 hover:to-indigo-700
                                 disabled:from-gray-400 disabled:to-gray-500
                                 text-white rounded-2xl transition-all duration-200
                                 disabled:cursor-not-allowed shadow-md hover:shadow-lg
                                 transform hover:scale-105 active:scale-95
                                 min-w-[50px] min-h-[50px] flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Quick suggestions for tool usage */}
                {toolExecutor && enableTools && input.length === 0 && (
                    <div className="flex flex-wrap gap-2 px-1 mt-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Try:
                        </span>
                        {[
                            "Create a concept map about...",
                            "Make a flowchart for...",
                            "Build a knowledge node on...",
                        ].map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => setInput(suggestion)}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                                         rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Status indicators */}
                <div className="flex items-center justify-center mt-3 min-h-[20px]">
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
