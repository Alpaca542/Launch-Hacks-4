import { createPortal } from "react-dom";
import { Handle, Position } from "reactflow";
import { Sparkles } from "lucide-react";

interface DragState {
    isDragging: boolean;
    suggestion?: string;
    x: number;
    y: number;
}

interface SuggestionHandlesProps {
    suggestions: string[];
    dragState: DragState;
    handleDragStart: (suggestion: string, e: PointerEvent) => void;
    handleOrigin: { x: number; y: number } | null;
    getParentCenter: () => { x: number; y: number };
}

const MAX_VISIBLE_HANDLES = 6;

interface HandlePosition {
    position: Position;
    style: { top: string };
}

const DragVisualization = ({
    dragState,
    handleOrigin,
    getParentCenter,
}: {
    dragState: DragState;
    handleOrigin: { x: number; y: number } | null;
    getParentCenter: () => { x: number; y: number };
}) => {
    if (!dragState.isDragging || typeof window === "undefined") {
        return null;
    }

    const startPoint = handleOrigin || getParentCenter();

    return createPortal(
        <>
            {/* Connection line */}
            <svg
                className="fixed inset-0 pointer-events-none z-[9998]"
                width="100vw"
                height="100vh"
            >
                <defs>
                    <linearGradient
                        id="connectionGradient"
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
                    x1={startPoint.x}
                    y1={startPoint.y}
                    x2={dragState.x}
                    y2={dragState.y}
                    stroke="url(#connectionGradient)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                />
            </svg>

            {/* Floating suggestion label */}
            <div
                className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: dragState.x, top: dragState.y }}
            >
                <div
                    className="px-4 py-2 rounded-lg shadow-xl font-medium text-white 
                               bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-sm
                               border border-blue-500/30 animate-bounce"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="animate-spin" />
                        {dragState.suggestion}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

const SuggestionHandle = ({
    suggestion,
    index,
    position,
    style,
    isHidden,
    onDragStart,
}: {
    suggestion: string;
    index: number;
    position: Position;
    style: { top: string };
    isHidden: boolean;
    onDragStart: (suggestion: string, e: PointerEvent) => void;
}) => {
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.button !== 0) return;
        onDragStart(suggestion, e.nativeEvent);
    };

    return (
        <div
            key={`${suggestion}-${index}`}
            className={`absolute z-10 select-none transition-all duration-200 ease-out ${
                isHidden ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
            style={{
                ...style,
                [position === Position.Right ? "right" : "left"]: "-12px",
                transform: "translateY(-50%)",
            }}
            onPointerDown={handlePointerDown}
            draggable={false}
        >
            <div
                className="group relative flex items-center justify-center w-8 h-8
                          bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200
                          dark:from-blue-950 dark:to-blue-900 dark:hover:from-blue-900 dark:hover:to-blue-800
                          border-2 border-blue-200 hover:border-blue-300 
                          dark:border-blue-700 dark:hover:border-blue-600
                          rounded-full cursor-grab active:cursor-grabbing 
                          shadow-sm hover:shadow-md transition-all duration-200 ease-out 
                          hover:scale-110 active:scale-95"
                title={suggestion}
                onPointerDown={handlePointerDown}
                draggable={false}
            >
                <Sparkles
                    size={16}
                    className="text-blue-600 dark:text-blue-400 transition-transform duration-200 
                             group-hover:rotate-12 group-active:rotate-45"
                />

                {/* Tooltip */}
                <div
                    className="absolute z-20 px-3 py-1.5 text-xs font-medium text-white 
                              bg-gray-900/90 backdrop-blur-sm rounded-md shadow-lg 
                              opacity-0 group-hover:opacity-100 pointer-events-none
                              transition-opacity duration-200 ease-out whitespace-nowrap
                              transform -translate-y-1/2"
                    style={{
                        [position === Position.Right ? "left" : "right"]:
                            "calc(100% + 8px)",
                        top: "50%",
                    }}
                >
                    {suggestion}
                    <div
                        className={`absolute w-0 h-0 top-1/2 transform -translate-y-1/2
                                   border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent
                                   ${
                                       position === Position.Right
                                           ? "border-r-[4px] border-r-gray-900/90 -left-1"
                                           : "border-l-[4px] border-l-gray-900/90 -right-1"
                                   }`}
                    />
                </div>

                {/* ReactFlow handle for connections */}
                <Handle
                    type="source"
                    position={position}
                    id={suggestion}
                    className="opacity-0"
                />
            </div>
        </div>
    );
};

export default function SuggestionHandles({
    suggestions,
    dragState,
    handleDragStart,
    handleOrigin,
    getParentCenter,
}: SuggestionHandlesProps) {
    if (!suggestions?.length) {
        return null;
    }

    const visibleSuggestions = suggestions.slice(0, MAX_VISIBLE_HANDLES);

    const getHandlePosition = (
        index: number,
        total: number
    ): HandlePosition => {
        if (total === 1) {
            return {
                position: Position.Right,
                style: { top: "50%" },
            };
        }

        const isRightSide = index < Math.ceil(total / 2);
        const side = isRightSide ? Position.Right : Position.Left;
        const sideIndex = isRightSide ? index : index - Math.ceil(total / 2);
        const sideTotal = isRightSide
            ? Math.ceil(total / 2)
            : Math.floor(total / 2);

        const percentage =
            sideTotal === 1 ? 50 : (sideIndex / (sideTotal - 1)) * 60 + 20; // Distribute between 20% and 80%

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
                    <SuggestionHandle
                        key={`${suggestion}-${index}`}
                        suggestion={suggestion}
                        index={index}
                        position={position}
                        style={style}
                        isHidden={isHidden}
                        onDragStart={handleDragStart}
                    />
                );
            })}

            {/* Drag visualization */}
            <DragVisualization
                dragState={dragState}
                handleOrigin={handleOrigin}
                getParentCenter={getParentCenter}
            />
        </>
    );
}
