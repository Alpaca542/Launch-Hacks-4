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
        extraData?: {
            initialText?: string;
            isQuizMode?: boolean;
            isDragConent?: boolean;
        }
    ) => void;
    onQuizCreate?: (
        topic: string,
        parent?: string,
        position?: { x: number; y: number }
    ) => void;
    layout?: number;
    contents?: string[];
    icon?: string;
    isQuiz: boolean;
}

interface DraggableEditableNodeProps {
    data: NodeData;
    id: string;
}

function Handles(data: any) {
    return (
        <>
            <Handle
                style={{ transform: "translateY(-150%)" }}
                type="source"
                position={Position.Bottom}
                id={data.label + "1"}
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
    const handleQuizRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{
        suggestion: string;
        x: number;
        y: number;
        isDragging: boolean;
        draggedContent?: string;
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

    const handleQuizDragEnd = useCallback(() => {
        const latestDragState = dragStateRef.current;
        if (latestDragState.isDragging && data.onNodeCallback) {
            const rfPos = screenToFlowPosition({
                x: latestDragState.x,
                y: latestDragState.y,
            });

            // Use onNodeCallback with "quiz" as the suggestion and pass isQuizMode in extraData
            data.onNodeCallback(data.label, id, rfPos, {
                initialText: "",
                isQuizMode: true,
            });
        }
        setDragState({ suggestion: "explain", x: 0, y: 0, isDragging: false });
        setHandleOrigin(null);
        document.removeEventListener("pointermove", handleDragMove);
        document.removeEventListener("pointerup", handleQuizDragEnd);
    }, [data.onNodeCallback, id, screenToFlowPosition]);

    // Content drag handlers
    const handleContentDragStart = useCallback(
        (e: PointerEvent, draggedElement: HTMLElement) => {
            // Get the content of the dragged element
            const draggedContent = draggedElement.outerHTML;

            // Find the center of the dragged element as the origin
            const rect = draggedElement.getBoundingClientRect();
            setHandleOrigin({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });

            setDragState({
                suggestion: "content",
                x: e.clientX,
                y: e.clientY,
                isDragging: true,
                draggedContent: draggedContent,
            });

            document.addEventListener("pointermove", handleDragMove);
            document.addEventListener("pointerup", handleContentDragEnd);
        },
        []
    );

    const optimizeToText = useCallback((html: string) => {
        // Create a temporary DOM element to parse the HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        const results: string[] = [];

        // Extract image titles/alt text
        const images = tempDiv.querySelectorAll("img");
        images.forEach((img) => {
            const title = img.title || img.alt;
            if (title && title.trim()) {
                results.push(title.trim());
            }
        });

        // Extract inner text content
        const textContent = tempDiv.textContent || tempDiv.innerText;
        if (textContent && textContent.trim()) {
            results.push(textContent.trim());
        }

        // Return combined results, or original HTML if no text/images found
        return results.length > 0 ? results.join(" ") : html;
    }, []);

    const handleContentDragEnd = useCallback(() => {
        const latestDragState = dragStateRef.current;
        if (
            latestDragState.isDragging &&
            data.onNodeCallback &&
            latestDragState.draggedContent
        ) {
            // Check if the drop position is over the current node
            const currentNode = handleQuizRef.current;
            if (currentNode) {
                const nodeRect = currentNode.getBoundingClientRect();
                const dropX = latestDragState.x;
                const dropY = latestDragState.y;

                // Check if drop position is within the node bounds
                const isOverNode =
                    dropX >= nodeRect.left &&
                    dropX <= nodeRect.right &&
                    dropY >= nodeRect.top &&
                    dropY <= nodeRect.bottom;

                // Only create new node if dropped outside the current node
                if (!isOverNode) {
                    const rfPos = screenToFlowPosition({
                        x: latestDragState.x,
                        y: latestDragState.y,
                    });

                    // Create a new node with the dragged content
                    data.onNodeCallback(
                        optimizeToText(latestDragState.draggedContent),
                        id,
                        rfPos,
                        {
                            initialText: "",
                            isQuizMode: false,
                            isDragConent: true,
                        }
                    );
                }
                // If dropped over the node, the drag is discarded (no callback)
            }
        }
        setDragState({
            suggestion: "explain",
            x: 0,
            y: 0,
            isDragging: false,
            draggedContent: undefined,
        });
        setHandleOrigin(null);
        document.removeEventListener("pointermove", handleDragMove);
        document.removeEventListener("pointerup", handleContentDragEnd);
    }, [data.onNodeCallback, id, screenToFlowPosition, optimizeToText]);

    // Set up content dragging event listeners
    useEffect(() => {
        if (!data.contents || data.contents.length === 0) return;

        const contentContainer =
            handleQuizRef.current?.querySelector(".node-rich-content");
        if (!contentContainer) return;

        const draggableClasses = [
            ".draggable-header-block",
            ".draggable-image-block",
            ".draggable-image-grid",
            ".draggable-text-block",
            ".draggable-point-item",
            ".draggable-diagram-block",
            ".draggable-video-block",
            ".draggable-code-block",
            ".draggable-timeline-item",
            ".draggable-card-item",
            ".draggable-section-block",
        ];

        const handlePointerDown = (e: Event) => {
            const pointerEvent = e as PointerEvent;
            // Only handle left mouse button
            if (pointerEvent.button !== 0) return;

            // Check if the target element is draggable
            const target = pointerEvent.target as HTMLElement;
            const draggableElement = draggableClasses.find((className) =>
                target.closest(className)
            );

            if (draggableElement) {
                const element = target.closest(draggableElement) as HTMLElement;
                if (element) {
                    e.stopPropagation();
                    e.preventDefault();
                    handleContentDragStart(pointerEvent, element);
                }
            }
        };

        contentContainer.addEventListener("pointerdown", handlePointerDown);

        return () => {
            contentContainer.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [data.contents, handleContentDragStart]);

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
            ref={handleQuizRef}
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
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/50 border border-white/80 
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
                        {!data.isQuiz && (
                            <div className="relative">
                                <div
                                    ref={nodeRef}
                                    className="group relative flex items-center justify-center w-10 h-10
                                              bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200
                                              border-2 border-emerald-200 hover:border-emerald-300 
                                              rounded-full cursor-grab active:cursor-grabbing 
                                              hover:shadow-md transition-all duration-200 ease-out 
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
                                    <Handle
                                        style={{
                                            transform: "translateY(-100%)",
                                        }}
                                        type="source"
                                        position={Position.Top}
                                        id="109"
                                    />
                                </div>
                            </div>
                        )}
                        {data.onQuizCreate && data.isQuiz && (
                            <div className="relative">
                                <div
                                    className="group relative flex items-center justify-center w-10 h-10
                                              bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200
                                              border-2 border-emerald-200 hover:border-emerald-300 
                                              rounded-full cursor-grab active:cursor-grabbing 
                                              hover:shadow-md transition-all duration-200 ease-out 
                                              hover:scale-110 active:scale-95"
                                    onClick={() => {
                                        if (data.onQuizCreate) {
                                            data.onQuizCreate(
                                                data.label || "New Quiz",
                                                "109",
                                                getParentCenter()
                                            );
                                        }
                                    }}
                                >
                                    <Brain className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors duration-200" />
                                </div>
                                <div
                                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                                               text-xs text-gray-500 font-medium whitespace-nowrap"
                                >
                                    Regenerate quiz
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
                        displayLine={
                            dragState.suggestion !== "quiz" &&
                            dragState.suggestion !== "content"
                        }
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
                                style={{ width: "100vw", height: "100vh" }}
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
                                    x1={handleOrigin?.x ?? getParentCenter().x}
                                    y1={handleOrigin?.y ?? getParentCenter().y}
                                    x2={dragState.x}
                                    y2={dragState.y}
                                    stroke="url(#quizConnectionGradient)"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    strokeDasharray="10,6"
                                    style={{
                                        opacity: 0.7,
                                        animation:
                                            "quizLineFade 1.2s ease-in-out infinite",
                                    }}
                                />
                                <style>
                                    {`
                                        @keyframes quizLineFade {
                                            0% { opacity: 0.7; }
                                            50% { opacity: 1; }
                                            100% { opacity: 0.7; }
                                        }
                                    `}
                                </style>
                            </svg>

                            {/* Floating quiz label */}
                            <div
                                className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: dragState.x, top: dragState.y }}
                            >
                                <div
                                    className="px-4 py-2 rounded-lg font-medium text-white 
                                           bg-gradient-to-r from-emerald-600 to-emerald-700
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

                {/* Content drag visualization */}
                {dragState.isDragging &&
                    dragState.suggestion === "content" &&
                    typeof window !== "undefined" &&
                    createPortal(
                        <>
                            {/* Connection line */}
                            <svg
                                className="fixed inset-0 pointer-events-none z-[9998]"
                                style={{ width: "100vw", height: "100vh" }}
                            >
                                <defs>
                                    <linearGradient
                                        id="contentConnectionGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="0%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#3b82f6"
                                            stopOpacity="0.8"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#1d4ed8"
                                            stopOpacity="1"
                                        />
                                    </linearGradient>
                                </defs>
                                <line
                                    x1={handleOrigin?.x ?? getParentCenter().x}
                                    y1={handleOrigin?.y ?? getParentCenter().y}
                                    x2={dragState.x}
                                    y2={dragState.y}
                                    stroke="url(#contentConnectionGradient)"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    strokeDasharray="8,4"
                                    style={{
                                        opacity: 0.7,
                                        animation:
                                            "contentLineFade 1s ease-in-out infinite",
                                    }}
                                />
                                <style>
                                    {`
                                        @keyframes contentLineFade {
                                            0% { opacity: 0.7; }
                                            50% { opacity: 1; }
                                            100% { opacity: 0.7; }
                                        }
                                    `}
                                </style>
                            </svg>

                            {/* Floating content preview */}
                            <div
                                className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: dragState.x, top: dragState.y }}
                            >
                                <div
                                    className="max-w-xs p-3 rounded-lg bg-white/95
                                           border-2 border-blue-500/30 animate-bounce"
                                    style={{
                                        transform: "scale(0.8)",
                                        opacity: 0.9,
                                    }}
                                >
                                    {dragState.draggedContent && (
                                        <div
                                            className="text-sm text-gray-800 overflow-hidden"
                                            style={{
                                                maxHeight: "200px",
                                                fontSize: "12px",
                                                lineHeight: "1.3",
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: dragState.draggedContent,
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </>,
                        document.body
                    )}
            </div>
            <Handles data={data} />
        </div>
    );
}
