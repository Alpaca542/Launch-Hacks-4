import { useState, useEffect, useMemo, useRef } from "react";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import LoadingSpinner from "./LoadingSpinner";
import { Handle, Position, useReactFlow } from "reactflow";
import { darkenColor, parseTextIntoTokens, Token } from "../utils/nodeHelpers";
import ModeMenu from "./ModeChooseMenu";

interface NodeData {
    label?: string;
    title?: string;
    suggestions?: string[];
    myColor?: string;
    summary?: string;
    full_text?: string;
    isLoading?: boolean;
    tokenColors?: { [key: string]: string };
    previousNode?: string; // Not used in static node
    onNodeCallback?: (
        mode?: string,
        parent?: string,
        position?: { x: number; y: number }
    ) => void;
}

interface StaticEditableNodeProps {
    data: NodeData;
    id: string;
}

function getContrastTextColor(
    hexColor: string | undefined
): "#000000" | "#ffffff" {
    if (!hexColor) return "#ffffff";
    const hex = (hexColor ?? "000000").replace(/^#/, "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const [R, G, B] = [r, g, b].map((v) => {
        const channel = v / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    return luminance > 0.179 ? "#000000" : "#ffffff";
}

function StaticEditableNode({ data, id }: StaticEditableNodeProps) {
    const [summary, setSummary] = useState<string>(
        data.summary || data.label || "Static Node"
    );
    const { screenToFlowPosition } = useReactFlow();
    const { handleTokenClick } = useTokenInteraction();
    const nodeRef = useRef<HTMLDivElement>(null);
    // Drag state for draggable menu
    const [dragState, setDragState] = useState<{
        mode?: "explain" | "answer" | "argue";
        x: number;
        y: number;
        isDragging: boolean;
    }>({ mode: undefined, x: 0, y: 0, isDragging: false });
    const dragStateRef = useRef(dragState);
    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);
    const [handleOrigin, setHandleOrigin] = useState<{
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        setSummary(data.summary || data.label || "Static Node");
    }, [data.summary, data.label]);

    // Parse text into tokens
    const tokens = parseTextIntoTokens(summary);
    const displayTokens = tokens;

    // Token click handler
    const handleTokenClickLocal = (token: Token, e: React.MouseEvent) => {
        e.stopPropagation();
        handleTokenClick(
            token,
            id,
            { x: 0, y: 0 }, // Static node, position not relevant
            "staticEditable",
            data.myColor,
            data.label || "Static Node",
            token.suggestionId
        );
    };

    // Drag handlers
    const handleDragStart = (
        mode: "explain" | "answer" | "argue",
        e: MouseEvent | PointerEvent
    ) => {
        const handleDiv = e.target as HTMLElement;
        const rect = handleDiv.getBoundingClientRect();
        setHandleOrigin({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        });
        setDragState({ mode, x: e.clientX, y: e.clientY, isDragging: true });
        document.addEventListener("pointermove", handleDragMove);
        document.addEventListener("pointerup", handleDragEnd);
    };
    const handleDragMove = (e: PointerEvent) => {
        setDragState((prev) =>
            prev.isDragging ? { ...prev, x: e.clientX, y: e.clientY } : prev
        );
    };
    const handleDragEnd = () => {
        // Use the ref to get the latest dragState
        const latestDragState = dragStateRef.current;
        console.log("handleDragEnd", latestDragState);
        if (latestDragState.isDragging && data.onNodeCallback) {
            const rfPos = screenToFlowPosition({
                x: latestDragState.x,
                y: latestDragState.y,
            });
            console.log("Calling onNodeCallback", latestDragState.mode, rfPos);
            data.onNodeCallback(latestDragState.mode || undefined, id, rfPos);
        }
        setDragState({ mode: "explain", x: 0, y: 0, isDragging: false });
        setHandleOrigin(null);
        document.removeEventListener("pointermove", handleDragMove);
        document.removeEventListener("pointerup", handleDragEnd);
    };
    const getParentCenter = () => {
        if (!nodeRef.current) return { x: 0, y: 0 };
        const rect = nodeRef.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    };

    // Memoize token rendering
    const tokenElements = useMemo(() => {
        const tokenColors = data.tokenColors || {};
        return displayTokens.map((token, index) => {
            const tokenKey = token.myConcept || token.word;
            const tokenColor = tokenColors[tokenKey];
            const isClickable = !tokenColor;
            return (
                <span
                    key={index}
                    className={`inline-block px-2 py-1 m-0.5 rounded-lg font-medium transition-all duration-200 ease-out
                        ${
                            isClickable
                                ? "cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/40"
                                : "cursor-not-allowed opacity-70"
                        }
                        ${
                            token.myConcept
                                ? "bg-blue-500/10 border border-blue-500/30"
                                : "border border-transparent hover:border-blue-500/30"
                        }`}
                    style={{
                        backgroundColor: tokenColor || "transparent",
                        color: tokenColor
                            ? getContrastTextColor(tokenColor)
                            : "#f8faff",
                        border: tokenColor
                            ? `1px solid ${darkenColor(tokenColor, 20)}`
                            : "",
                    }}
                    onClick={(e) =>
                        isClickable
                            ? handleTokenClickLocal(token, e)
                            : e.stopPropagation()
                    }
                >
                    {token.word}
                    {index < displayTokens.length - 1 ? " " : ""}
                </span>
            );
        });
    }, [displayTokens, data.tokenColors]);

    // Memoize suggestions rendering
    const suggestionsElements = useMemo(() => {
        const tokenColors = data.tokenColors || {};
        if (!data.suggestions || data.suggestions.length === 0) {
            return (
                <div className="text-slate-500 italic text-sm">
                    No suggestions
                </div>
            );
        }
        return data.suggestions.map((suggestion, index) => {
            const tokenColor = tokenColors[suggestion];
            const isClickable = !tokenColor;
            return (
                <span
                    key={index}
                    className={`inline-block px-2 py-1 m-0.5 rounded-md text-sm 
                        bg-white/5 border border-white/10 transition-all duration-200 
                        ${
                            isClickable
                                ? "cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/40"
                                : "cursor-not-allowed opacity-70"
                        }`}
                    style={{
                        backgroundColor: tokenColor || "transparent",
                        color: tokenColor
                            ? getContrastTextColor(tokenColor)
                            : "#f8faff",
                        border: tokenColor
                            ? `1px solid ${darkenColor(tokenColor, 20)}`
                            : "",
                    }}
                    onClick={(e) =>
                        isClickable
                            ? handleTokenClickLocal(
                                  {
                                      word: suggestion,
                                      myConcept: suggestion,
                                      suggestionId:
                                          (data.label || "") +
                                          suggestion +
                                          index,
                                  },
                                  e
                              )
                            : e.stopPropagation()
                    }
                >
                    {suggestion}
                </span>
            );
        });
    }, [data.suggestions, data.tokenColors]);

    // Memoize content rendering
    const renderContent = useMemo(() => {
        if (data.isLoading) {
            return (
                <div className="flex items-center justify-center gap-2 py-8">
                    <LoadingSpinner size="small" color="#6366f1" />
                    <span className="text-slate-400 text-sm">
                        Loading concept...
                    </span>
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <div className="text-base font-semibold text-gray-100">
                        {data.title || "Node"}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="w-8 h-8 bg-blue-500/25 text-blue-400 border border-blue-500/35 rounded-lg 
                                hover:bg-blue-500/35 hover:border-blue-500/55 hover:-translate-y-0.5 
                                transition-all duration-150 flex items-center justify-center text-sm"
                            title="Show full text"
                        >
                            📄
                        </button>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="cursor-text leading-relaxed break-words text-lg font-medium">
                        {tokenElements}
                    </div>
                </div>
                <div className="mt-2">
                    <div className="text-sm font-semibold text-slate-400 mb-1.5">
                        Suggestions
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {suggestionsElements}
                    </div>
                </div>
            </div>
        );
    }, [data.isLoading, data.title, tokenElements, suggestionsElements]);

    return (
        <div
            ref={nodeRef}
            className="bg-black border border-white/[0.1] rounded-[20px] p-7 min-w-[320px] max-w-[500px] 
                transition-all duration-150 ease-in-out cursor-pointer select-none overflow-hidden
                opacity-[0.98] border-b-[3px] border-b-white/[0.06]
                hover:opacity-100 hover:bg-[#28282c] hover:border-white/[0.2]"
            style={{
                backgroundColor: "#000000", // Always black
                color: "#f8faff", // Always light text
                border: "1px solid rgba(255, 255, 255, 0.1)", // Always static border
            }}
        >
            <div className="relative pointer-events-auto text-[#f8faff] text-[18px] leading-[1.7] font-semibold">
                {renderContent}
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-target"
            />
            <ModeMenu
                dragState={dragState}
                handleDragStart={handleDragStart}
                handleOrigin={handleOrigin}
                getParentCenter={getParentCenter}
            />
        </div>
    );
}

export default StaticEditableNode;
