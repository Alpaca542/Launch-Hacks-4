/**
 * Enhanced Chat Components with Advanced UI Features
 */

import React from "react";
import { Bot, User, Wand2, Zap, Brain, GitBranch } from "lucide-react";

interface ToolIndicatorProps {
    toolName: string;
    isActive: boolean;
}

export const ToolIndicator: React.FC<ToolIndicatorProps> = ({
    toolName,
    isActive,
}) => {
    const getToolIcon = (name: string) => {
        switch (name) {
            case "create_knowledge_node":
                return <Brain className="w-4 h-4" />;
            case "create_concept_map":
                return <GitBranch className="w-4 h-4" />;
            case "create_flowchart":
                return <Zap className="w-4 h-4" />;
            default:
                return <Wand2 className="w-4 h-4" />;
        }
    };

    const getToolColor = (name: string) => {
        switch (name) {
            case "create_knowledge_node":
                return "text-blue-500 bg-blue-100 dark:bg-blue-900/20";
            case "create_concept_map":
                return "text-green-500 bg-green-100 dark:bg-green-900/20";
            case "create_flowchart":
                return "text-purple-500 bg-purple-100 dark:bg-purple-900/20";
            default:
                return "text-orange-500 bg-orange-100 dark:bg-orange-900/20";
        }
    };

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getToolColor(
                toolName
            )} ${isActive ? "animate-pulse" : ""}`}
        >
            {getToolIcon(toolName)}
            <span className="capitalize">
                {toolName.replace("create_", "").replace("_", " ")}
            </span>
        </div>
    );
};

interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
    timestamp?: Date;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    role,
    content,
    isStreaming = false,
    timestamp,
}) => {
    return (
        <div
            className={`flex items-start gap-3 ${
                role === "user" ? "flex-row-reverse" : ""
            }`}
        >
            {/* Enhanced Avatar */}
            <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                    role === "user"
                        ? "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white"
                        : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white"
                }`}
            >
                {role === "user" ? (
                    <User className="w-5 h-5" />
                ) : (
                    <Bot className="w-5 h-5" />
                )}
            </div>

            {/* Message Content */}
            <div
                className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg ${
                    role === "user" ? "text-right" : ""
                }`}
            >
                <div
                    className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${
                        role === "user"
                            ? "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white rounded-tr-md"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-tl-md"
                    } relative group`}
                >
                    {/* Message Text */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {content}
                        {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse rounded-sm" />
                        )}
                    </div>

                    {/* Timestamp */}
                    {timestamp && (
                        <div
                            className={`text-xs mt-1 opacity-60 ${
                                role === "user" ? "text-right" : "text-left"
                            }`}
                        >
                            {timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    placeholder?: string;
    toolsEnabled: boolean;
    onToolsToggle: (enabled: boolean) => void;
    hasTools: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSubmit,
    isLoading,
    placeholder = "Type your message...",
    toolsEnabled,
    onToolsToggle,
    hasTools,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="space-y-3">
            {/* Tools Toggle */}
            {hasTools && (
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Node Creation Tools:
                        </span>
                        <button
                            onClick={() => onToolsToggle(!toolsEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                                toolsEnabled
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md"
                                    : "bg-gray-300 dark:bg-gray-600"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                                    toolsEnabled
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                    {toolsEnabled && (
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
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
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
                    {value.length > 100 && (
                        <div className="absolute bottom-1 right-14 text-xs text-gray-400">
                            {value.length}
                        </div>
                    )}
                </div>

                <button
                    onClick={onSubmit}
                    disabled={!value.trim() || isLoading}
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
                        <svg
                            className="w-5 h-5 transform rotate-45"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {/* Quick suggestions for tool usage */}
            {hasTools && toolsEnabled && value.length === 0 && (
                <div className="flex flex-wrap gap-2 px-1">
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
                            onClick={() => onChange(suggestion)}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                                     rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
