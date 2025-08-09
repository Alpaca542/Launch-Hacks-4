import React, { useState, useRef, useEffect } from "react";
import {
    X,
    MessageSquare,
    Settings,
    Bot,
    User,
    Send,
    Loader2,
} from "lucide-react";
import { Node } from "reactflow";
import {
    askAIStream,
    NODE_CREATION_TOOLS,
    ToolCall,
} from "../services/aiService";
import { saveChatConversation } from "../services/chatService.tsx";
import { useAuth } from "../hooks/useAuth";
import { executeTool } from "../services/toolExecutor";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

interface RightSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentBoardId?: string;
    currentBoardName?: string;
    nodes?: Node[];
    setNodes?: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    onNodesChange?: (changes: any) => void;
    onEdgesChange?: (changes: any) => void;
    getLastTwoLayouts?: () => number[];
    addLayout?: (layout: number) => void;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({
    isOpen,
    onClose,
    currentBoardId,
    currentBoardName,
    nodes = [],
    setNodes,
    onNodesChange,
    onEdgesChange,
    getLastTwoLayouts: _getLastTwoLayouts,
    addLayout: _addLayout,
}) => {
    const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
    const [isAnimating, setIsAnimating] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [enableTools, setEnableTools] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        } else {
            setIsAnimating(false);
        }
    }, [isOpen]);

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

        let assistantResponseContent = "";

        try {
            await askAIStream(
                userMessageContent,
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
                async () => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessage.id
                                ? { ...msg, isStreaming: false }
                                : msg
                        )
                    );
                    setIsLoading(false);

                    setIsSaving(true);
                    try {
                        if (currentBoardId) {
                            await saveChatConversation();
                        }
                    } catch (error) {
                        console.error("Error saving chat conversation:", error);
                    } finally {
                        setIsSaving(false);
                    }
                },
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
                },
                {
                    enableTools: enableTools,
                    availableTools: NODE_CREATION_TOOLS,
                    currentBoardId: currentBoardId,
                    onToolCall: async (toolCall: ToolCall) => {
                        try {
                            await executeTool(
                                toolCall,
                                nodes,
                                setNodes,
                                onNodesChange,
                                onEdgesChange
                            );
                            return "Tool executed successfully";
                        } catch (error) {
                            console.error("Error executing tool:", error);
                            return "Error executing tool";
                        }
                    },
                }
            );
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage =
                "Sorry, I encountered an error. Please try again.";
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessage.id
                        ? { ...msg, content: errorMessage, isStreaming: false }
                        : msg
                )
            );
            setIsLoading(false);
        }

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

    const tabs = [
        {
            id: "chat" as const,
            label: "AI Assistant",
            icon: MessageSquare,
            description: "Chat with AI",
        },
        {
            id: "settings" as const,
            label: "Settings",
            icon: Settings,
            description: "Panel settings",
        },
    ];

    return (
        <div
            className={`fixed top-0 right-0 w-96 h-screen z-50
                bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                border-l border-gray-200/50 dark:border-gray-700/50
                transition-all duration-300 ease-out
                ring-1 ring-white/20 dark:ring-white/10
                before:absolute before:inset-0 before:bg-gradient-to-br 
                before:from-white/40 before:to-transparent before:pointer-events-none
                dark:before:from-gray-800/40 dark:before:to-transparent
                overflow-hidden
                ${
                    isOpen
                        ? "transform translate-x-0"
                        : "transform translate-x-full"
                }
            `}
        >
            <div
                className={`w-full h-full flex flex-col transition-all duration-300 ease-out ${
                    isAnimating
                        ? "transform translate-x-0 opacity-100"
                        : "transform translate-x-full opacity-0"
                }`}
            >
                {/* Header */}
                <div
                    className={`flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-700/50
                           transition-all duration-400 ease-out ${
                               isAnimating
                                   ? "transform translate-y-0 opacity-100"
                                   : "transform -translate-y-4 opacity-0"
                           }`}
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            AI Assistant
                        </h3>
                    </div>

                    <button
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 
                             p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 
                             transition-all duration-200 transform hover:scale-105"
                        onClick={onClose}
                        title="Close panel"
                        aria-label="Close AI assistant panel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex space-x-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${
                                            activeTab === tab.id
                                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === "chat" ? (
                        <div className="flex-1 flex flex-col h-full">
                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
                                {messages.length === 0 && (
                                    <div
                                        className={`text-center mt-8 transition-all duration-500 ease-out ${
                                            isAnimating
                                                ? "transform translate-y-0 opacity-100"
                                                : "transform translate-y-8 opacity-0"
                                        }`}
                                    >
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <Bot className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            AI Assistant Ready
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                                            Ask me anything and I'll help you
                                            with intelligent responses and node
                                            creation!
                                        </p>

                                        {/* Status indicators */}
                                        <div className="space-y-3">
                                            <div className="mx-auto max-w-xs px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                                <div className="flex items-center justify-center space-x-2 mb-2">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                        Node Creation Tools
                                                        Active
                                                    </p>
                                                </div>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    I can create knowledge
                                                    nodes, concept maps, and
                                                    flowcharts
                                                </p>
                                            </div>

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
                                                        Conversations will be
                                                        saved
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
                                                        Conversations won't be
                                                        saved
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
                                            message.role === "user"
                                                ? "flex-row-reverse"
                                                : ""
                                        }`}
                                    >
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

                                        <div
                                            className={`flex-1 max-w-[260px] ${
                                                message.role === "user"
                                                    ? "text-right"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`inline-block px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                                    message.role === "user"
                                                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-md"
                                                        : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 rounded-tl-md"
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
                                                                        animationDelay:
                                                                            "0.1s",
                                                                    }}
                                                                ></div>
                                                                <div
                                                                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                                                                    style={{
                                                                        animationDelay:
                                                                            "0.2s",
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="ml-2">
                                                                Thinking...
                                                            </span>
                                                        </div>
                                                        {enableTools && (
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
                            <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30 backdrop-blur-sm">
                                {/* Tools Toggle */}
                                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            AI Tools:
                                        </span>
                                        <button
                                            onClick={() =>
                                                setEnableTools(!enableTools)
                                            }
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

                                <div className="p-6">
                                    {/* Quick suggestions */}
                                    {enableTools &&
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
                                                    ].map(
                                                        (suggestion, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() =>
                                                                    setInput(
                                                                        suggestion
                                                                    )
                                                                }
                                                                className="text-xs px-3 py-1.5 bg-white/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 
                                                             rounded-full hover:bg-white dark:hover:bg-gray-600 transition-all duration-200 
                                                             border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Input Area */}
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1 relative">
                                            <textarea
                                                ref={inputRef}
                                                value={input}
                                                onChange={(e) =>
                                                    setInput(e.target.value)
                                                }
                                                onKeyDown={handleKeyDown}
                                                placeholder="Ask me anything..."
                                                disabled={isLoading}
                                                rows={1}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300/50 dark:border-gray-600/50 rounded-xl 
                                                         bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white text-sm
                                                         focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
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
                                                    target.style.height =
                                                        "auto";
                                                    target.style.height =
                                                        Math.min(
                                                            target.scrollHeight,
                                                            96
                                                        ) + "px";
                                                }}
                                            />

                                            {input.length > 100 && (
                                                <div className="absolute bottom-2 right-12 text-xs text-gray-400">
                                                    {input.length}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={
                                                !input.trim() || isLoading
                                            }
                                            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 
                                                     hover:from-blue-600 hover:to-purple-700
                                                     disabled:from-gray-400 disabled:to-gray-500
                                                     text-white rounded-xl transition-all duration-200
                                                     disabled:cursor-not-allowed shadow-sm hover:shadow-md
                                                     min-w-[48px] min-h-[48px] flex items-center justify-center
                                                     transform hover:scale-105 disabled:transform-none"
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
                                                Press Enter to send •
                                                Shift+Enter for new line
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Settings Tab */
                        <div
                            className={`flex-1 overflow-y-auto p-6 transition-all duration-500 ease-out ${
                                isAnimating
                                    ? "transform translate-y-0 opacity-100"
                                    : "transform translate-y-4 opacity-0"
                            }`}
                        >
                            <div className="space-y-6">
                                {/* Board Info */}
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                            <User className="w-3 h-3 text-white" />
                                        </div>
                                        Current Board
                                    </h3>
                                    {currentBoardId ? (
                                        <div className="space-y-3">
                                            <div className="px-4 py-3 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                    {currentBoardName ||
                                                        "Unnamed Board"}
                                                </p>
                                                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 font-mono">
                                                    ID: {currentBoardId}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                                                <span>Active Nodes</span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                    {nodes.length}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                No board selected
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                                        Quick Actions
                                    </h3>
                                    <div className="space-y-2">
                                        <button className="w-full text-left px-4 py-3 text-sm bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200/30 dark:border-gray-600/30 hover:border-gray-300/50 dark:hover:border-gray-500/50 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                                                <span>Export Board</span>
                                            </div>
                                        </button>
                                        <button className="w-full text-left px-4 py-3 text-sm bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200/30 dark:border-gray-600/30 hover:border-gray-300/50 dark:hover:border-gray-500/50 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                                                <span>Board Settings</span>
                                            </div>
                                        </button>
                                        <button className="w-full text-left px-4 py-3 text-sm bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200/30 dark:border-gray-600/30 hover:border-gray-300/50 dark:hover:border-gray-500/50 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                                                <span>View History</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* AI Tools Info */}
                                <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 p-5 shadow-lg shadow-emerald-200/10 dark:shadow-emerald-900/10">
                                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center">
                                        <span className="text-base mr-2">
                                            🤖
                                        </span>
                                        AI Capabilities
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-xs text-emerald-600 dark:text-emerald-400">
                                        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <span>Knowledge nodes</span>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                            <div
                                                className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                                                style={{
                                                    animationDelay: "0.5s",
                                                }}
                                            ></div>
                                            <span>Concept maps</span>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                            <div
                                                className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                                                style={{ animationDelay: "1s" }}
                                            ></div>
                                            <span>Flowcharts</span>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                            <div
                                                className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                                                style={{
                                                    animationDelay: "1.5s",
                                                }}
                                            ></div>
                                            <span>Q&A Support</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RightSidePanel;
