import { createPortal } from "react-dom";
import { Handle, Position } from "reactflow";
import { Sparkles } from "lucide-react";

interface SuggestionHandlesProps {
    suggestions: string[];
    dragState: {
        isDragging: boolean;
        suggestion?: string;
        x: number;
        y: number;
    };
    handleDragStart: (suggestion: string, e: PointerEvent) => void;
    handleOrigin: { x: number; y: number } | null;
    getParentCenter: () => { x: number; y: number };
}

export default function SuggestionHandles({
    suggestions,
    dragState,
    handleDragStart,
    handleOrigin,
    getParentCenter,
}: SuggestionHandlesProps) {
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    const maxHandles = 6; // Maximum number of handles to show
    const visibleSuggestions = suggestions.slice(0, maxHandles);

    // Calculate positions around the node
    const getHandlePosition = (index: number, total: number) => {
        if (total === 1) {
            return { position: Position.Right, style: { top: "50%" } };
        }

        // Distribute handles around the node (right side primarily, then left)
        const side =
            index < Math.ceil(total / 2) ? Position.Right : Position.Left;
        const sideIndex =
            side === Position.Right ? index : index - Math.ceil(total / 2);
        const sideTotal =
            side === Position.Right
                ? Math.ceil(total / 2)
                : Math.floor(total / 2);

        const percentage =
            sideTotal === 1 ? 50 : (sideIndex / (sideTotal - 1)) * 60 + 20; // 20% to 80%

        return {
            position: side,
            style: { top: `${percentage}%` },
        };
    };

    return (
        <>
            {/* Suggestion handles */}
            {visibleSuggestions.map((suggestion, index) => {
                const { position, style } = getHandlePosition(
                    index,
                    visibleSuggestions.length
                );
                const isHidden =
                    dragState.isDragging && dragState.suggestion === suggestion;

                return (
                    <div
                        draggable={false}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (e.button !== 0) return;
                            handleDragStart(suggestion, e.nativeEvent);
                        }}
                        key={`${suggestion}-${index}`}
                        className={`absolute z-10 select-none transition-opacity duration-150 ${
                            isHidden ? "opacity-0" : "opacity-100"
                        }`}
                        style={{
                            ...style,
                            [position === Position.Right ? "right" : "left"]:
                                "-12px",
                            transform: "translateY(-50%)",
                        }}
                    >
                        <div
                            draggable={false}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (e.button !== 0) return;
                                handleDragStart(suggestion, e.nativeEvent);
                            }}
                            className="group relative bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 
                                     dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-700 dark:hover:border-blue-600
                                     rounded-full p-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md
                                     transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                            title={suggestion}
                        >
                            <Sparkles
                                size={14}
                                className="text-blue-600 dark:text-blue-400"
                            />

                            {/* Tooltip */}
                            <div
                                className="absolute z-20 px-2 py-1 text-xs font-medium text-white bg-gray-900 
                                          rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none
                                          transition-opacity duration-200 ease-out whitespace-nowrap"
                                style={{
                                    [position === Position.Right
                                        ? "left"
                                        : "right"]: "calc(100% + 8px)",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            >
                                {suggestion}
                                <div
                                    className={`absolute w-0 h-0 top-1/2 transform -translate-y-1/2
                                               border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent
                                               ${
                                                   position === Position.Right
                                                       ? "border-r-[4px] border-r-gray-900 -left-1"
                                                       : "border-l-[4px] border-l-gray-900 -right-1"
                                               }`}
                                />
                            </div>

                            {/* ReactFlow handle for connections */}
                            <Handle
                                type="source"
                                position={position}
                                id={`suggestion-${index}`}
                                className="opacity-0"
                            />
                        </div>
                    </div>
                );
            })}

            {/* drag ghost + line ---------------------------------------------------- */}
            {dragState.isDragging &&
                typeof window !== "undefined" &&
                createPortal(
                    <>
                        <svg
                            className="fixed inset-0 pointer-events-none z-[9998]"
                            width="100vw"
                            height="100vh"
                        >
                            <line
                                x1={
                                    handleOrigin
                                        ? handleOrigin.x
                                        : getParentCenter().x
                                }
                                y1={
                                    handleOrigin
                                        ? handleOrigin.y
                                        : getParentCenter().y
                                }
                                x2={dragState.x}
                                y2={dragState.y}
                                stroke="blue"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* floating label */}
                        <div
                            className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
                            style={{ left: dragState.x, top: dragState.y }}
                        >
                            <div
                                className="px-4 py-1 rounded-lg shadow-lg font-semibold text-white backdrop-blur-sm"
                                style={{
                                    background: "blue",
                                }}
                            >
                                {dragState.suggestion}
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}
