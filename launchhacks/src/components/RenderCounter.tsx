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
        <div
            style={{
                position: "absolute",
                top: "-20px",
                right: "0",
                background: "red",
                color: "white",
                padding: "2px 6px",
                fontSize: "10px",
                borderRadius: "3px",
                zIndex: 1000,
                pointerEvents: "none",
            }}
        >
            {renderCount.current}
        </div>
    );
};

export default RenderCounter;
