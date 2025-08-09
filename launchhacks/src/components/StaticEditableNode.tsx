import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useReactFlow, Handle, Position } from "reactflow";
import { Sparkles } from "lucide-react";
import SuggestionHandles from "./SuggestionHandles";
import "../styles/layouts.css";

interface NodeData {
    label?: string;
    title?: string;
    suggestions?: string[];
    myColor?: string;
    isLoading?: boolean;
    icon?: string;
    onNodeCallback?: (
        suggestion?: string,
        parent?: string,
        position?: { x: number; y: number },
        extraData?: { initialText?: string }
    ) => void;
}

interface StaticEditableNodeProps {
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

function StaticEditableNode({ data, id }: StaticEditableNodeProps) {
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

    // Determine if this should be light or dark theme based on color
    const isLightTheme = useMemo(() => {
        if (!data.myColor) return true; // Default to light

        // Convert hex to RGB and calculate luminance
        const hex = data.myColor.replace(/^#/, "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5; // Light theme if luminance > 0.5
    }, [data.myColor]);

    // Memoize style objects to prevent recreation
    const nodeStyle = useMemo(() => {
        if (isLightTheme) {
            return {
                background: data.myColor
                    ? `linear-gradient(135deg, ${data.myColor}f0, ${data.myColor}e0)`
                    : "linear-gradient(135deg, #ffffff, #fafafa)",
                borderColor: data.myColor
                    ? `${data.myColor}60`
                    : "rgba(229, 231, 235, 0.6)",
                color: "#1f2937", // Dark text for light theme
                transform: "translateZ(0)",
                willChange: "transform",
                backfaceVisibility: "hidden" as const,
            };
        } else {
            return {
                background: "#000000",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: "#f8faff", // Light text for dark theme
                transform: "translateZ(0)",
                willChange: "transform",
                backfaceVisibility: "hidden" as const,
            };
        }
    }, [data.myColor, isLightTheme]);

    return (
        <div
            ref={nodeRef}
            className={`group relative border rounded-3xl min-w-[320px] max-w-[640px] 
                       cursor-grab select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                       ${
                           isLightTheme
                               ? "bg-white/95 border-gray-200/60 hover:border-gray-300/80"
                               : "bg-black border-white/10 hover:border-white/20"
                       }`}
            style={nodeStyle}
        >
            <div className="relative p-6">
                {/* Header */}
                <header className="flex flex-col items-center gap-4 mb-6">
                    <div className="flex items-center gap-3 group/header">
                        {/* Icon */}
                        {data.icon ? (
                            <div
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border backdrop-blur-sm
                                           transition-transform duration-200 ease-out group-hover/header:scale-105
                                           ${
                                               isLightTheme
                                                   ? "bg-white/50 border-white/80"
                                                   : "bg-white/10 border-white/20"
                                           }`}
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
                            className={`text-2xl font-bold tracking-tight transition-colors duration-200
                                       ${
                                           isLightTheme
                                               ? "text-gray-900 group-hover/header:text-gray-700"
                                               : "text-gray-100 group-hover/header:text-gray-300"
                                       }`}
                        >
                            {data.label || data.title || "Node"}
                        </h2>
                    </div>
                </header>

                {/* Suggestions using SuggestionHandles component */}
                {data.suggestions && data.suggestions.length > 0 && (
                    <SuggestionHandles
                        suggestions={data.suggestions}
                        dragState={dragState}
                        handleDragStart={handleDragStart}
                        handleOrigin={handleOrigin}
                        getParentCenter={getParentCenter}
                        displayLine={true}
                    />
                )}
            </div>
            <Handles />
        </div>
    );
}

export default StaticEditableNode;
