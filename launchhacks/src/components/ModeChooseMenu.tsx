import { Info, Lightbulb, Gavel } from "lucide-react";
import { createPortal } from "react-dom";
import { Handle, Position } from "reactflow";

// ---- visual config ---------------------------------------------------------
const MODE_STYLES: Record<
    "explain" | "answer" | "argue",
    { classes: string; color: string; Icon: React.ElementType }
> = {
    explain: {
        classes:
            "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700",
        color: "#3b82f6",
        Icon: Info,
    },
    answer: {
        classes:
            "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700",
        color: "#10b981",
        Icon: Lightbulb,
    },
    argue: {
        classes:
            "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700",
        color: "#fb7185",
        Icon: Gavel,
    },
};
// ---------------------------------------------------------------------------

export default function ModeMenu({
    dragState,
    handleDragStart,
    handleOrigin,
    getParentCenter,
}: {
    dragState: {
        isDragging: boolean;
        mode?: "explain" | "answer" | "argue";
        x: number;
        y: number;
    };
    handleDragStart: (
        mode: "explain" | "answer" | "argue",
        e: PointerEvent
    ) => void;
    handleOrigin: { x: number; y: number } | null;
    getParentCenter: () => { x: number; y: number };
}) {
    return (
        <>
            {/* bottom‑docked menu --------------------------------------------------- */}
            <div
                className="absolute left-1/2 z-10 flex gap-2 select-none"
                style={{
                    transform: "translateX(-50%) translateY(24px)", // center by x, shift down by y (48px as example)
                }}
            >
                {(["explain", "answer", "argue"] as const).map((mode) => {
                    const { classes, Icon } = MODE_STYLES[mode];
                    const isHidden =
                        dragState.isDragging && dragState.mode === mode;
                    return (
                        <div
                            key={mode}
                            draggable={false}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (e.button !== 0) return;
                                handleDragStart(mode, e.nativeEvent);
                            }}
                            className={`px-2 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 shadow-sm cursor-grab transition-opacity duration-150 ${classes} ${
                                isHidden ? "opacity-0" : "opacity-100"
                            }`}
                            style={{ position: "relative", zIndex: 11 }}
                        >
                            <Icon size={16} strokeWidth={2} />
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            <Handle
                                type={"source"}
                                position={Position.Bottom}
                                id={mode}
                            />
                        </div>
                    );
                })}
            </div>

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
                                stroke={
                                    MODE_STYLES[dragState.mode ?? "explain"]
                                        .color
                                }
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
                                    background:
                                        MODE_STYLES[dragState.mode ?? "explain"]
                                            .color,
                                }}
                            >
                                {dragState.mode &&
                                    dragState.mode.charAt(0).toUpperCase() +
                                        dragState.mode.slice(1)}
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}
