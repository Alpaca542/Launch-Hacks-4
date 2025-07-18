import { Handle, Position } from "reactflow";
import { useEffect, useRef, useState } from "react";

interface TempInputNodeProps {
    data: {
        mode: string;
        onSubmit: (value: string) => void;
        onReady?: () => void; // optional, for parent sync
    };
}

export default function TempInputNode({ data }: TempInputNodeProps) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                data.onReady?.();
                // Debug info (optional)
                // console.log("Focused input:", inputRef.current);
            }
        });

        return () => cancelAnimationFrame(raf);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) data.onSubmit(trimmed);
    };

    return (
        <div className="bg-white border border-blue-400 rounded-lg p-3 shadow-md min-w-[180px]">
            <form onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    className="border rounded px-2 py-1 text-sm w-full"
                    placeholder={`Enter ${data.mode}...`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </form>
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
