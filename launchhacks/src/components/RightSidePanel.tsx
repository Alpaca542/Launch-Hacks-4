import React, { useState } from "react";
import { X, MessageSquare, Settings, Bot, User } from "lucide-react";
import SimpleChat from "./SimpleChat";
import { Node } from "reactflow";

interface RightSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    // Chat props
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
    getLastTwoLayouts,
    addLayout,
}) => {
    const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");

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
        <>
            {/* Simple Side Panel - Always Open Style */}
            <div
                className={`
                fixed top-0 right-0 w-96
                bg-transparent
                h-fit
                max-h-[700px]
                overflow-y-auto
                border-l border-gray-200/50 dark:border-gray-700/50
                shadow-xl shadow-gray-900/10 dark:shadow-black/30
                z-50
                transform transition-all duration-300 ease-out
                ${isOpen ? "translate-x-0" : "translate-x-full"}
            `}
            >
                {/* Clean Header */}
                <div className="flex flex-col border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Simple Tabs */}
                        <div className="px-4 pb-4">
                            <div className="flex space-x-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${
                                                activeTab === tab.id
                                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
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
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-800/50">
                        {activeTab === "chat" ? (
                            <SimpleChat
                                className="flex-1"
                                currentBoardId={currentBoardId}
                                currentBoardName={currentBoardName}
                                nodes={nodes}
                                setNodes={setNodes}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                getLastTwoLayouts={getLastTwoLayouts}
                                addLayout={addLayout}
                            />
                        ) : (
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-4">
                                    {/* Board Info */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-blue-500" />
                                            Current Board
                                        </h3>
                                        {currentBoardId ? (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {currentBoardName ||
                                                        "Unnamed Board"}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {nodes.length} nodes
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                                No board selected
                                            </p>
                                        )}
                                    </div>

                                    {/* AI Capabilities */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border p-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                                            🤖 What I can do
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>
                                                    Create knowledge nodes
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>Build concept maps</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>Generate flowcharts</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>Answer questions</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white/80 dark:from-gray-900/50 dark:to-gray-800/80 backdrop-blur-sm">
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
                                                                ID:{" "}
                                                                {currentBoardId}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                                                            <span>
                                                                Active Nodes
                                                            </span>
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
                                                            <span>
                                                                Export Board
                                                            </span>
                                                        </div>
                                                    </button>
                                                    <button className="w-full text-left px-4 py-3 text-sm bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200/30 dark:border-gray-600/30 hover:border-gray-300/50 dark:hover:border-gray-500/50 group">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                                                            <span>
                                                                Board Settings
                                                            </span>
                                                        </div>
                                                    </button>
                                                    <button className="w-full text-left px-4 py-3 text-sm bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200/30 dark:border-gray-600/30 hover:border-gray-300/50 dark:hover:border-gray-500/50 group">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                                                            <span>
                                                                View History
                                                            </span>
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
                                                        <span>
                                                            Knowledge nodes
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                                        <div
                                                            className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                                                            style={{
                                                                animationDelay:
                                                                    "0.5s",
                                                            }}
                                                        ></div>
                                                        <span>
                                                            Concept maps
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                                        <div
                                                            className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                                                            style={{
                                                                animationDelay:
                                                                    "1s",
                                                            }}
                                                        ></div>
                                                        <span>Flowcharts</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 rounded-lg p-2 backdrop-blur-sm">
                                                        <div
                                                            className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                                                            style={{
                                                                animationDelay:
                                                                    "1.5s",
                                                            }}
                                                        ></div>
                                                        <span>Q&A Support</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default RightSidePanel;
