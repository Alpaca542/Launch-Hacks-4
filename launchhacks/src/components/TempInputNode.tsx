import { Handle, Position } from "reactflow";
import { useEffect, useRef, useState } from "react";
import { Info, Lightbulb, Gavel } from "lucide-react"; // npm i lucide-react

interface TempInputNodeProps {
    data: {
        mode: "explain" | "answer" | "argue";
        onSubmit: (v: string) => void;
    };
}

// --- visual presets ---------------------------------------------------------
const MODE_STYLES: Record<
    TempInputNodeProps["data"]["mode"],
    {
        border: string;
        ring: string;
        placeholder: string;
        Icon: React.ElementType;
    }
> = {
    explain: {
        border: "border-blue-400",
        ring: "ring-blue-100 dark:ring-blue-500/30",
        placeholder: "Explain this concept...",
        Icon: Info,
    },
    answer: {
        border: "border-emerald-400",
        ring: "ring-emerald-100 dark:ring-emerald-500/30",
        placeholder: "Answer this question...",
        Icon: Lightbulb,
    },
    argue: {
        border: "border-rose-400",
        ring: "ring-rose-100 dark:ring-rose-500/30",
        placeholder: "Argue this point...",
        Icon: Gavel,
    },
};
// ---------------------------------------------------------------------------

export default function TempInputNode({ data }: TempInputNodeProps) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.focus();
                observer.disconnect();
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) data.onSubmit(trimmed);
    };

    /* ----- style tokens for current mode ----------------------------------- */
    const { border, ring, placeholder, Icon } = MODE_STYLES[data.mode];

    return (
        <div
            className={`relative bg-white dark:bg-gray-900 shadow-lg rounded-xl px-4 py-3 min-w-[200px] border ${border} ring-1 ${ring} transition-shadow`}
        >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                {/* mode icon */}
                <Icon
                    size={18}
                    className="text-gray-400 dark:text-gray-500 shrink-0"
                />
                {/* text input */}
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500 caret-gray-900 dark:caret-gray-100 text-gray-900 dark:text-gray-100"
                />
            </form>

            {/* react‑flow connection handles */}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
