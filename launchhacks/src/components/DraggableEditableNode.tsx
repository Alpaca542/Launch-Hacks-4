import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useReactFlow, Handle, Position } from "reactflow";
import LoadingSpinner from "./LoadingSpinner";
import { Loader2, Sparkles, Brain } from "lucide-react";
import SuggestionHandles from "./SuggestionHandles";
import { createPortal } from "react-dom";
import "../styles/layouts.css";

interface NodeData {
    label?: string;
    title?: string;
    suggestions?: string[];
    myColor?: string;
    summary?: string;
    full_text?: string;
    onExpand?: () => void;
    expanded?: boolean;
    isLoading?: boolean;
    loadingElement?: React.ReactElement;
    tokenColors?: { [key: string]: string };
    previousNode?: string;
    onNodeCallback?: (
        suggestion?: string,
        parent?: string,
        position?: { x: number; y: number },
        extraData?: { initialText?: string; isQuizMode?: boolean }
    ) => void;
    onQuizCreate?: (
        topic: string,
        parent?: string,
        position?: { x: number; y: number }
    ) => void;
    layout?: number;
    contents?: string[];
    icon?: string;
}

interface DraggableEditableNodeProps {
    data: NodeData;
    id: string;
}

function Handles() {
    return (
        <>
            <Handle
                style={{ transform: "translateY(-150%)" }}
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
            <Handle
                style={{ transform: "translateY(100%)" }}
                type="target"
                position={Position.Top}
                id="top-target"
            />
            <Handle
                style={{ transform: "translateY(100%)" }}
                type="source"
                position={Position.Left}
                id="left-source"
            />
            <Handle
                style={{ transform: "translateY(100%)" }}
                type="target"
                position={Position.Left}
                id="left-target"
            />
            <Handle
                style={{ transform: "translateY(100%)" }}
                type="source"
                position={Position.Right}
                id="right-source"
            />
            <Handle
                style={{ transform: "translateY(100%)" }}
                type="target"
                position={Position.Right}
                id="right-target"
            />
        </>
    );
}

export function DraggableEditableNode({
    data,
    id,
}: DraggableEditableNodeProps) {
    useEffect(() => {
        // Initialize default layout if needed
        if (!data.layout) {
            data.layout = 1;
        }
    }, [data.layout]);

    const { screenToFlowPosition } = useReactFlow();
    const nodeRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{
        suggestion: string;
        x: number;
        y: number;
        isDragging: boolean;
    }>({ suggestion: "", x: 0, y: 0, isDragging: false });

    // Add a ref to always have the latest dragState
    const dragStateRef = useRef(dragState);

    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    const [handleOrigin, setHandleOrigin] = useState<{
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    // Render content based on whether rich content is available
    const renderContent = useMemo(() => {
        // Render rich content if available
        if (data.contents && data.contents.length > 0) {
            // If the HTML is empty or just whitespace, show fallback
            if (!data.contents[0]) {
                return (
                    <div className="text-center py-8 text-gray-500">
                        <p>No content available</p>
                    </div>
                );
            }

            return (
                <div
                    className="node-rich-content w-full"
                    dangerouslySetInnerHTML={{ __html: data.contents[0] }}
                />
            );
        }

        // Fallback to token rendering for compatibility
        if (data.isLoading) {
            return (
                <div className="flex items-center justify-center gap-3 py-6">
                    <LoadingSpinner />
                    <span className="text-slate-400 text-sm">
                        Generating content...
                    </span>
                </div>
            );
        }

        return null;
    }, [data.contents, data.isLoading]);

    const getParentCenter = useCallback(() => {
        if (!nodeRef.current) return { x: 0, y: 0 };
        const rect = nodeRef.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    }, []);
    // Mouse event handlers for drag (memoized)
    const handleDragStart = useCallback(
        (suggestion: string, e: MouseEvent | PointerEvent) => {
            // Find the handle's DOM node
            const handleDiv = e.target as HTMLElement;
            const rect = handleDiv.getBoundingClientRect();
            // Use the center of the handle div as the origin
            setHandleOrigin({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });
            setDragState({
                suggestion: suggestion,
                x: e.clientX,
                y: e.clientY,
                isDragging: true,
            });
            document.addEventListener("pointermove", handleDragMove);
            document.addEventListener("pointerup", handleDragEnd);
        },
        []
    );

    // Quiz drag handlers
    const handleQuizDragStart = useCallback((e: MouseEvent | PointerEvent) => {
        // Find the handle's DOM node
        const handleDiv = e.target as HTMLElement;
        const rect = handleDiv.getBoundingClientRect();
        // Use the center of the handle div as the origin
        setHandleOrigin({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        });
        setDragState({
            suggestion: "quiz",
            x: e.clientX,
            y: e.clientY,
            isDragging: true,
        });
        document.addEventListener("pointermove", handleDragMove);
        document.addEventListener("pointerup", handleQuizDragEnd);
    }, []);

    const handleDragMove = useCallback((e: PointerEvent) => {
        setDragState((prev) =>
            prev.isDragging ? { ...prev, x: e.clientX, y: e.clientY } : prev
        );
    }, []);

    const handleDragEnd = useCallback(() => {
        const latestDragState = dragStateRef.current;
        if (latestDragState.isDragging && data.onNodeCallback) {
            const rfPos = screenToFlowPosition({
                x: latestDragState.x,
                y: latestDragState.y,
            });

            data.onNodeCallback(
                latestDragState.suggestion || undefined,
                id,
                rfPos
            );
        }
        setDragState({ suggestion: "explain", x: 0, y: 0, isDragging: false });
        setHandleOrigin(null);
        document.removeEventListener("pointermove", handleDragMove);
        document.removeEventListener("pointerup", handleDragEnd);
    }, [data.onNodeCallback, id, screenToFlowPosition]);

    const handleQuizDragEnd = useCallback(() => {
        const latestDragState = dragStateRef.current;
        if (latestDragState.isDragging && data.onNodeCallback) {
            const rfPos = screenToFlowPosition({
                x: latestDragState.x,
                y: latestDragState.y,
            });

            // Use onNodeCallback with "quiz" as the suggestion and pass isQuizMode in extraData
            data.onNodeCallback("quiz", id, rfPos, {
                initialText: "",
                isQuizMode: true,
            });
        }
        setDragState({ suggestion: "explain", x: 0, y: 0, isDragging: false });
        setHandleOrigin(null);
        document.removeEventListener("pointermove", handleDragMove);
        document.removeEventListener("pointerup", handleQuizDragEnd);
    }, [data.onNodeCallback, id, screenToFlowPosition]);

    // Memoize style objects to prevent recreation
    const nodeStyle = useMemo(
        () => ({
            background: data.myColor
                ? `linear-gradient(135deg, ${data.myColor}f0, ${data.myColor}e0)`
                : "linear-gradient(135deg, #ffffff, #fafafa)",
            borderColor: data.myColor
                ? `${data.myColor}60`
                : "rgba(229, 231, 235, 0.6)",
            transform: "translateZ(0)",
            willChange: "transform",
            backfaceVisibility: "hidden" as const,
        }),
        [data.myColor]
    );

    // Memoize mouse event handlers to prevent recreation
    const handleMouseEnter = useCallback(() => {
        // Could be used for showing node menu or other hover effects
    }, []);

    const handleMouseLeave = useCallback(() => {
        // Could be used for hiding node menu or other hover effects
    }, []);

    return (
        <div
            ref={nodeRef}
            className="group relative bg-white/95 border border-gray-200/60 rounded-3xl
                       min-w-[320px] max-w-[640px] cursor-grab select-none
                       transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:border-gray-300/80"
            style={nodeStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative p-6 text-gray-900">
                {/* Loading state */}
                {data.isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="relative">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-500/20 animate-ping" />
                        </div>
                        <span className="text-gray-600 text-sm font-medium">
                            Generating content...
                        </span>
                    </div>
                )}

                {/* Header */}
                {!data.isLoading && (
                    <header className="flex flex-col items-center gap-4 mb-6">
                        <div className="flex items-center gap-3 group/header">
                            {/* Icon */}
                            {data.icon ? (
                                <div
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-sm border border-white/80 
                                               transition-transform duration-200 ease-out group-hover/header:scale-105"
                                >
                                    <span
                                        className="text-2xl"
                                        dangerouslySetInnerHTML={{
                                            __html: data.icon,
                                        }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white 
                                               transition-transform duration-200 ease-out group-hover/header:scale-105"
                                >
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            )}
                            <h2
                                className="text-2xl font-bold tracking-tight text-gray-900 
                                          transition-colors duration-200 group-hover/header:text-gray-700"
                            >
                                {data.label || "Node"}
                            </h2>
                        </div>

                        {/* Quiz Creation Button */}
                        {data.onQuizCreate && (
                            <div className="relative">
                                <div
                                    className="group relative flex items-center justify-center w-10 h-10
                                              bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200
                                              border-2 border-emerald-200 hover:border-emerald-300 
                                              rounded-full cursor-grab active:cursor-grabbing 
                                              shadow-sm hover:shadow-md transition-all duration-200 ease-out 
                                              hover:scale-110 active:scale-95"
                                    title="Drag to create quiz"
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (e.button !== 0) return;
                                        handleQuizDragStart(e.nativeEvent);
                                    }}
                                    draggable={false}
                                >
                                    <Brain className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors duration-200" />
                                </div>
                                <div
                                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                                               text-xs text-gray-500 font-medium whitespace-nowrap"
                                >
                                    Quiz
                                </div>
                            </div>
                        )}
                    </header>
                )}

                {/* Content */}
                {!data.isLoading && renderContent}

                {data.suggestions && data.suggestions.length > 0 && (
                    <SuggestionHandles
                        suggestions={data.suggestions}
                        dragState={dragState}
                        handleDragStart={handleDragStart}
                        handleOrigin={handleOrigin}
                        getParentCenter={getParentCenter}
                    />
                )}

                {/* Quiz drag visualization */}
                {dragState.isDragging &&
                    dragState.suggestion === "quiz" &&
                    typeof window !== "undefined" &&
                    createPortal(
                        <>
                            {/* Connection line */}
                            <svg
                                className="fixed inset-0 pointer-events-none z-[9998]"
                                width="100vw"
                                height="100vh"
                            >
                                <defs>
                                    <linearGradient
                                        id="quizConnectionGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="0%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#10b981"
                                            stopOpacity="0.8"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#059669"
                                            stopOpacity="1"
                                        />
                                    </linearGradient>
                                </defs>
                                <line
                                    x1={handleOrigin?.x || getParentCenter().x}
                                    y1={handleOrigin?.y || getParentCenter().y}
                                    x2={dragState.x}
                                    y2={dragState.y}
                                    stroke="url(#quizConnectionGradient)"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    strokeDasharray="5,5"
                                    className="animate-pulse"
                                />
                            </svg>

                            {/* Floating quiz label */}
                            <div
                                className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: dragState.x, top: dragState.y }}
                            >
                                <div
                                    className="px-4 py-2 rounded-lg shadow-xl font-medium text-white 
                                           bg-gradient-to-r from-emerald-600 to-emerald-700 backdrop-blur-sm
                                           border border-emerald-500/30 animate-bounce"
                                >
                                    <div className="flex items-center gap-2">
                                        <Brain
                                            size={14}
                                            className="animate-pulse"
                                        />
                                        Create Quiz
                                    </div>
                                </div>
                            </div>
                        </>,
                        document.body
                    )}
            </div>
            <Handles />
        </div>
    );
}
