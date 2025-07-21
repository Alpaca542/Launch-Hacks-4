import { useState, useEffect, useMemo, useRef } from "react";
import { useReactFlow, Handle, Position } from "reactflow";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import LoadingSpinner from "./LoadingSpinner";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { parseTextIntoTokens, Token } from "../utils/nodeHelpers";
import ModeMenu from "./ModeChooseMenu";
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
        mode?: string,
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
    const [summary, setSummary] = useState<string>(
        data.summary || data.label || "Draggable Node"
    );

    useEffect(() => {
        // Initialize default layout if needed
        if (!data.layout) {
            data.layout = 1;
        }
    }, [data.layout]);

    const { getNode, setViewport, screenToFlowPosition } = useReactFlow();
    const { handleTokenClick } = useTokenInteraction();
    const [isNodeMenuVisible, setIsNodeMenuVisible] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{
        mode?: "explain" | "answer" | "argue";
        x: number;
        y: number;
        isDragging: boolean;
    }>({ mode: undefined, x: 0, y: 0, isDragging: false });

    // Add a ref to always have the latest dragState
    const dragStateRef = useRef(dragState);
    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    // Add state for the handle's initial position
    const [handleOrigin] = useState<{
        x: number;
        y: number;
    } | null>(null);

    // Show node menu on hover
    function handleMouseEnter() {
        setIsNodeMenuVisible(true);
    }

    function handleMouseLeave() {
        setIsNodeMenuVisible(false);
    }

    // Sync local state with prop changes (e.g., when AI response updates data)
    useEffect(() => {
        setSummary(data.summary || data.label || "Draggable Node");
    }, [data.summary, data.label]);

    // Parse text into tokens
    const tokens = parseTextIntoTokens(summary);

    // Display tokens based on expansion state
    const displayTokens = (() => {
        return tokens;
    })();

    // Check if token is clickable
    const isTokenClickable = () => {
        return true; // All tokens are clickable now
    };

    // Token click handler
    const handleTokenClickLocal = (token: Token, e: React.MouseEvent) => {
        e.stopPropagation();

        // Get current node info
        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            const nodePosition = screenToFlowPosition({
                x: rect.left,
                y: rect.top,
            });

            handleTokenClick(
                token,
                id,
                nodePosition,
                "draggableEditable",
                data.myColor,
                data.full_text || summary
            );
        }
    };

    // Render content based on whether rich content is available
    const renderContent = useMemo(() => {
        // Render rich content if available
        if (data.contents && data.contents.length > 0) {
            // If the HTML is empty or just whitespace, show fallback
            if (!data.contents[0].trim()) {
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

        return (
            <div className="space-y-4">
                {/* Main content area */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
                    <div className="flex flex-wrap gap-2">
                        {displayTokens.map((t, idx) => {
                            const tokenColors = data.tokenColors || {};
                            const color = tokenColors[t.myConcept || t.word];
                            const clickable = isTokenClickable() && !color;

                            return (
                                <span
                                    key={idx}
                                    onClick={(e) =>
                                        clickable
                                            ? handleTokenClickLocal(t, e)
                                            : e.stopPropagation()
                                    }
                                    style={{
                                        backgroundColor: color || undefined,
                                        borderColor: color || "transparent",
                                    }}
                                    className={[
                                        "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
                                        "transition-all duration-200 ease-out",
                                        color
                                            ? "text-white shadow-sm"
                                            : "bg-white/80 backdrop-blur-sm text-gray-700 border border-white/90",
                                        clickable
                                            ? "cursor-pointer hover:scale-105 active:scale-95"
                                            : "cursor-default opacity-80",
                                    ].join(" ")}
                                >
                                    {t.word}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Suggestions */}
                {data.suggestions && data.suggestions.length > 0 && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                                Explore Next
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    className="px-3 py-1.5 text-sm rounded-full bg-blue-50/80 text-blue-700 
                                             border border-blue-200/60 backdrop-blur-sm transition-all duration-200
                                             hover:bg-blue-100/80 hover:border-blue-300/80 hover:scale-105
                                             active:scale-95"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (nodeRef.current) {
                                            const rect =
                                                nodeRef.current.getBoundingClientRect();
                                            const nodePosition =
                                                screenToFlowPosition({
                                                    x: rect.left,
                                                    y: rect.top,
                                                });
                                            const token: Token = {
                                                word: suggestion,
                                            };
                                            handleTokenClick(
                                                token,
                                                id,
                                                nodePosition,
                                                "draggableEditable",
                                                data.myColor,
                                                data.full_text ||
                                                    data.title ||
                                                    suggestion
                                            );
                                        }
                                    }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }, [
        data.contents,
        data.isLoading,
        data.title,
        data.suggestions,
        displayTokens,
        isTokenClickable,
        data.tokenColors,
        handleTokenClickLocal,
        data.myColor,
        handleTokenClick,
        id,
        nodeRef,
        screenToFlowPosition,
        data.full_text,
    ]);

    // Helper functions
    const navigateToPreviousNode = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data.previousNode) {
            const previousNode = getNode(data.previousNode);
            if (previousNode) {
                setViewport({
                    x: -previousNode.position.x + 200,
                    y: -previousNode.position.y + 200,
                    zoom: 1,
                });
            }
        }
    };

    const handleDragStart = (
        mode: "explain" | "answer" | "argue",
        e: PointerEvent
    ) => {
        setDragState({
            mode,
            x: e.clientX,
            y: e.clientY,
            isDragging: true,
        });
    };

    const getParentCenter = () => {
        if (!nodeRef.current) return { x: 0, y: 0 };
        const rect = nodeRef.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    };

    return (
        <div
            ref={nodeRef}
            className="group relative bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-3xl
                       min-w-[320px] max-w-[640px] cursor-grab select-none
                       transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:border-gray-300/80"
            style={{
                background: data.myColor
                    ? `linear-gradient(135deg, ${data.myColor}f0, ${data.myColor}e0)`
                    : "linear-gradient(135deg, #ffffff, #fafafa)",
                borderColor: data.myColor
                    ? `${data.myColor}60`
                    : "rgba(229, 231, 235, 0.6)",
                transform: "translateZ(0)", // Force hardware acceleration
                willChange: "transform",
                backfaceVisibility: "hidden",
            }}
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
                                {data.title || data.label || "Node"}
                            </h2>
                        </div>

                        {isNodeMenuVisible && data.previousNode && (
                            <div
                                className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                                style={{
                                    animation: isNodeMenuVisible
                                        ? "slideInFromTop 0.3s ease-out forwards"
                                        : undefined,
                                }}
                            >
                                <button
                                    onClick={navigateToPreviousNode}
                                    title="Go to previous node"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm text-gray-700 
                                             border border-white/80 transition-all duration-200 ease-out
                                             hover:bg-white/80 hover:text-gray-900 hover:scale-105 
                                             active:scale-95"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Back
                                    </span>
                                </button>
                            </div>
                        )}
                    </header>
                )}

                {/* Content */}
                {!data.isLoading && renderContent}

                <ModeMenu
                    dragState={dragState}
                    handleDragStart={handleDragStart}
                    handleOrigin={handleOrigin}
                    getParentCenter={getParentCenter}
                />
            </div>
            <Handles />
        </div>
    );
}
