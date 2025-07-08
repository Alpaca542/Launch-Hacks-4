import { useRef, useEffect } from "react";

interface RenderCounterProps {
    name: string;
    enabled?: boolean;
}

export const RenderCounter: React.FC<RenderCounterProps> = ({
    name,
    enabled = process.env.NODE_ENV === "development",
}) => {
    const renderCount = useRef(0);

    useEffect(() => {
        renderCount.current++;
        if (enabled) {
            console.log(`${name} rendered ${renderCount.current} times`);
        }
    });

    if (!enabled) return null;

    return (
        <div className="absolute -top-5 right-0 bg-red-500 dark:bg-red-600 text-white px-2 py-1 text-xs rounded-md z-[1000] pointer-events-none font-mono">
            {renderCount.current}
        </div>
    );
};

export default RenderCounter;
