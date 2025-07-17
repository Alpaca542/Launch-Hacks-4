import { Handle, Position } from "reactflow";
import { useEffect, useRef, useState } from "react";

interface TempInputNodeProps {
    id: string;
    data: {
        mode: string;
        onSubmit: (id: string, value: string) => void;
    };
}

export default function TempInputNode({ id, data }: TempInputNodeProps) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="bg-white border border-blue-400 rounded-lg p-3 shadow-md min-w-[180px]">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (value.trim()) data.onSubmit(id, value);
                }}
            >
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
