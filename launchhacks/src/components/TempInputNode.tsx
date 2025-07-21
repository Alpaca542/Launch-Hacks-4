import { Handle, Position } from "reactflow";
import { useEffect, useRef, useState } from "react";
import { Info, Lightbulb, Gavel, Hash } from "lucide-react"; // npm i lucide-react

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

interface TempInputNodeProps {
    data: NodeData;
    id: string;
}

// --- visual presets ---------------------------------------------------------
type ModeType = "default" | "explain" | "answer" | "argue";

const MODE_STYLES: Record<
    ModeType,
    {
        border: string;
        ring: string;
        placeholder: string;
        Icon: React.ElementType;
        color: string;
    }
> = {
    default: {
        border: "border-gray-400",
        ring: "ring-gray-100 dark:ring-gray-500/30",
        placeholder: "Enter your text...",
        Icon: Hash,
        color: "#6b7280",
    },
    explain: {
        border: "border-blue-400",
        ring: "ring-blue-100 dark:ring-blue-500/30",
        placeholder: "Explain this concept...",
        Icon: Info,
        color: "#3b82f6",
    },
    answer: {
        border: "border-emerald-400",
        ring: "ring-emerald-100 dark:ring-emerald-500/30",
        placeholder: "Answer this question...",
        Icon: Lightbulb,
        color: "#10b981",
    },
    argue: {
        border: "border-rose-400",
        ring: "ring-rose-100 dark:ring-rose-500/30",
        placeholder: "Argue this point...",
        Icon: Gavel,
        color: "#f43f5e",
    },
};
// ---------------------------------------------------------------------------

export default function TempInputNode({ data }: TempInputNodeProps) {
    // Ensure currentMode always has a valid value
    const [currentMode, setCurrentMode] = useState<ModeType>("default");
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState<string>(data.label || "");

    const modes: ModeType[] = ["default", "explain", "answer", "argue"];

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        // Try immediate focus first
        const focusTimeout = setTimeout(() => {
            el.focus();
        }, 100); // Small delay to ensure the component is fully rendered

        // Also use intersection observer as fallback
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.focus();
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
            }
        );

        observer.observe(el);

        return () => {
            clearTimeout(focusTimeout);
            observer.disconnect();
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) data.onNodeCallback?.(trimmed);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const currentIndex = modes.indexOf(currentMode);
            let nextIndex;

            if (e.key === "ArrowUp") {
                nextIndex =
                    currentIndex > 0 ? currentIndex - 1 : modes.length - 1;
            } else {
                nextIndex =
                    currentIndex < modes.length - 1 ? currentIndex + 1 : 0;
            }

            setCurrentMode(modes[nextIndex]);
        }
    };

    /* ----- style tokens for current mode ----------------------------------- */
    const modeStyle = MODE_STYLES[currentMode] || MODE_STYLES["default"];
    const { border, ring, placeholder, color } = modeStyle;
    const Icon = modeStyle.Icon;

    return (
        <div
            className={`relative bg-white dark:bg-gray-900 shadow-lg rounded-xl px-4 py-3 min-w-[200px] border transition-all duration-300 ease-in-out ${border} ring-1 ${ring}`}
            style={{
                borderColor: color,
                boxShadow: `0 0 0 1px ${color}20, 0 4px 6px -1px rgb(0 0 0 / 0.1)`,
            }}
        >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                {/* animated mode icon with simple transitions */}
                <div className="transition-all duration-300 ease-in-out transform hover:scale-110">
                    <Icon
                        size={18}
                        className="shrink-0 transition-colors duration-300 ease-in-out animate-pulse"
                        style={{ color: color }}
                    />
                </div>
                {/* text input */}
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500 caret-black dark:caret-white text-gray-900 dark:text-gray-100 transition-all duration-300"
                    style={{
                        caretColor: color,
                    }}
                />
            </form>

            {/* Mode indicator with smooth color transition */}
            <div
                className="absolute -top-2 -right-2 px-2 py-1 text-xs font-semibold text-white rounded-full transition-all duration-300 ease-in-out"
                style={{ backgroundColor: color }}
            >
                {currentMode}
            </div>

            {/* react‑flow connection handles */}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
