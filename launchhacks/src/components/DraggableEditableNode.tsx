import { useState, useEffect, useMemo, useRef } from "react";
import { useReactFlow, Handle, Position } from "reactflow";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import LoadingSpinner from "./LoadingSpinner";
import { createPortal } from "react-dom";
import {
    ArrowLeft,
    FileText,
    Loader2,
    GripVertical,
    Sparkles,
} from "lucide-react";
import { darkenColor, parseTextIntoTokens, Token } from "../utils/nodeHelpers";
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

    const { getNodes, getNode, setViewport, screenToFlowPosition } =
        useReactFlow();
    const { handleTokenClick, showExplanation } = useTokenInteraction();
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
    const [handleOrigin, setHandleOrigin] = useState<{
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
            return (
                <div
                    className="node-rich-content"
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
            <section className="grid gap-4 p-4 rounded-2xl border border-white/10 bg-black/10 shadow-inner backdrop-blur-sm">
                <div className="rounded-lg border border-slate-600/20 bg-slate-800/40 px-4 py-3 space-y-2">
                    <span className="text-xs font-semibold text-slate-400/80">
                        {data.title || "Content"}
                    </span>
                    <div className="flex flex-wrap gap-1">
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
                                        color: color
                                            ? getContrastTextColor(color)
                                            : getContrastTextColor(
                                                  data.myColor!
                                              ),
                                        borderColor: color
                                            ? darkenColor(color, 20)
                                            : "transparent",
                                        boxShadow: color
                                            ? `0 0 0 1px ${color}25`
                                            : "",
                                    }}
                                    className={[
                                        "inline-block px-2 py-1 rounded-md text-[0.7rem] font-medium",
                                        "transition-all duration-300",
                                        t.myConcept
                                            ? "bg-indigo-500/10 border"
                                            : "border hover:border-indigo-400/40",
                                        clickable
                                            ? "cursor-pointer hover:bg-indigo-500/20 hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                                            : "cursor-not-allowed opacity-70",
                                    ].join(" ")}
                                >
                                    {t.word}
                                    {idx < displayTokens.length - 1 ? " " : ""}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Render suggestions */}
                {data.suggestions && data.suggestions.length > 0 && (
                    <div className="rounded-lg border border-slate-600/20 bg-slate-800/40 px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-semibold text-slate-400/80">
                                Explore Next
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    className="px-3 py-1 text-xs rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
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
            </section>
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
    const getContrastTextColor = (backgroundColor: string): string => {
        // Simple contrast calculation for text visibility
        const hex = backgroundColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? "#000000" : "#ffffff";
    };

    const handleShowExplanation = () => {
        if (showExplanation && data.title && data.full_text) {
            showExplanation(data.title, data.full_text);
        }
    };

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
            className="bg-[#202023] border border-white/[0.12] rounded-2xl p-5 min-w-[280px] max-w-[600px] 
                       transition-all duration-200 ease-in-out cursor-grab select-none
                       hover:transform hover:-translate-y-[3px]
                       hover:border-white/[0.18] hover:bg-[#242427]"
            style={{
                background: data.myColor,
                color: data.myColor
                    ? getContrastTextColor(data.myColor)
                    : "#f0f4f8",
                border: data.myColor
                    ? `2px solid ${darkenColor(data.myColor, 0.5)}`
                    : "2px solid rgba(255, 255, 255, 0.12)",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative pointer-events-auto text-[#f0f4f8] text-[17px] leading-[1.7] font-medium">
                {/* ───────────────── Loading state */}
                {data.isLoading && (
                    <div className="flex items-center justify-center gap-3 py-6 animate-pulse">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-slate-400 text-sm font-medium">
                            Loading concept…
                        </span>
                    </div>
                )}

                {/* ───────────────── Header */}
                <header className="flex flex-col items-center gap-3 mb-6">
                    <div className="flex items-center gap-3 group">
                        {/* Icon if available */}
                        {data.icon ? (
                            <span className="text-2xl">{data.icon}</span>
                        ) : (
                            <Sparkles className="w-7 h-7 text-indigo-300 drop-shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                        )}
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-100 drop-shadow-sm">
                            {data.title || data.label || "Node"}
                        </h2>
                    </div>

                    {isNodeMenuVisible && (
                        <div className="flex gap-3">
                            {data.previousNode && (
                                <button
                                    onClick={navigateToPreviousNode}
                                    title="Go to previous node"
                                    className="grid place-items-center w-9 h-9 rounded-xl border border-slate-500/30 bg-slate-600/10 text-slate-300 backdrop-blur
                                           transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-600/20 hover:border-slate-500/50 active:translate-y-0"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={handleShowExplanation}
                                title="Show full text"
                                className="grid place-items-center w-9 h-9 rounded-xl border border-indigo-500/30 bg-indigo-600/10 text-indigo-300 backdrop-blur
                                       transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600/20 hover:border-indigo-500/50 active:translate-y-0"
                            >
                                <FileText className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </header>

                {renderContent}
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
