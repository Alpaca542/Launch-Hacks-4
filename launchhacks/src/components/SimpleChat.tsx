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
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            AI Assistant Ready
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
                            Ask me anything and I'll help you with intelligent
                            responses and node creation!
                        </p>

                        {/* Status indicators */}
                        <div className="space-y-3 mt-6">
                            {toolExecutor && (
                                <div className="mx-auto max-w-xs px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center justify-center space-x-2 mb-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                            Node Creation Tools Active
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        I can create knowledge nodes, concept
                                        maps, and flowcharts
                                    </p>
                                </div>
                            )}

                            {currentBoardId ? (
                                <div className="mx-auto max-w-xs px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center justify-center space-x-2 mb-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                            Board Connected
                                        </p>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        {currentBoardName}
                                    </p>
                                    <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                                        Conversations will be saved
                                    </p>
                                </div>
                            ) : (
                                <div className="mx-auto max-w-xs px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center justify-center space-x-2 mb-1">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                            No Board Selected
                                        </p>
                                    </div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Conversations won't be saved
                                    </p>
                                </div>
                            )}
                        </div>
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
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                                message.role === "user"
                                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
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
                            className={`flex-1 max-w-[280px] ${
                                message.role === "user" ? "text-right" : ""
                            }`}
                        >
                            <div
                                className={`inline-block px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    message.role === "user"
                                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-md"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-md"
                                }`}
                            >
                                <div className="whitespace-pre-wrap break-words">
                                    {message.content}
                                    {message.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 bg-current ml-1 animate-pulse rounded-sm" />
                                    )}
                                </div>
                            </div>

                            {message.role === "assistant" &&
                                message.isStreaming && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <div className="flex space-x-1">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div
                                                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                                                    style={{
                                                        animationDelay: "0.1s",
                                                    }}
                                                ></div>
                                                <div
                                                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                                                    style={{
                                                        animationDelay: "0.2s",
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="ml-2">
                                                Thinking...
                                            </span>
                                        </div>
                                        {toolExecutor && enableTools && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-emerald-600 dark:text-emerald-400 text-xs">
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
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                {/* Tools Toggle */}
                {toolExecutor && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                AI Tools:
                            </span>
                            <button
                                onClick={() => setEnableTools(!enableTools)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ${
                                    enableTools
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                        : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            >
                                <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                                        enableTools
                                            ? "translate-x-5"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                        {enableTools && (
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    Active
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4">
                    {/* Quick suggestions */}
                    {toolExecutor &&
                        enableTools &&
                        input.length === 0 &&
                        messages.length === 0 && (
                            <div className="mb-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Try asking:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Create a concept map about AI",
                                        "Make a flowchart for user login",
                                        "Build nodes on machine learning",
                                    ].map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setInput(suggestion)}
                                            className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                                                 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Input Area */}
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything..."
                                disabled={isLoading}
                                rows={1}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl 
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         placeholder-gray-500 dark:placeholder-gray-400
                                         resize-none min-h-[48px] max-h-24
                                         shadow-sm transition-all duration-200"
                                style={{
                                    height: "auto",
                                    minHeight: "48px",
                                }}
                                onInput={(e) => {
                                    const target =
                                        e.target as HTMLTextAreaElement;
                                    target.style.height = "auto";
                                    target.style.height =
                                        Math.min(target.scrollHeight, 96) +
                                        "px";
                                }}
                            />

                            {/* Character counter for longer messages */}
                            {input.length > 100 && (
                                <div className="absolute bottom-2 right-12 text-xs text-gray-400">
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
                            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 
                                     hover:from-blue-600 hover:to-purple-700
                                     disabled:from-gray-400 disabled:to-gray-500
                                     text-white rounded-xl transition-all duration-200
                                     disabled:cursor-not-allowed shadow-sm hover:shadow-md
                                     min-w-[48px] min-h-[48px] flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center justify-center mt-3 min-h-[16px]">
                        {isSaving && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Saving...</span>
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
        </div>
    );
};

export default SimpleChat;
