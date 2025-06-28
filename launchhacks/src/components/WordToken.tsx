import React from "react";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";

interface WordTokenProps {
    value: string;
    nodeId?: string;
    nodePosition?: { x: number; y: number };
    nodeType?: string;
    nodeColor?: string;
    tokenColor?: string;
}

function WordToken({
    value,
    nodeId,
    nodePosition,
    nodeType,
    nodeColor,
    tokenColor,
}: WordTokenProps) {
    const { handleTokenClick } = useTokenInteraction();
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        console.log("WordToken clicked:", {
            value,
            nodeId,
            nodePosition,
            nodeType,
            nodeColor,
            tokenColor,
        });

        if (nodeId && nodePosition && nodeType) {
            handleTokenClick(value, nodeId, nodePosition, nodeType, nodeColor);
        }
    };

    return (
        <div
            className="word-token"
            onClick={handleClick}
            style={{
                backgroundColor: tokenColor,
                color: tokenColor ? getContrastColor(tokenColor) : undefined,
                cursor: nodeId ? "pointer" : "default",
                padding: tokenColor ? "2px 4px" : undefined,
                borderRadius: tokenColor ? "4px" : undefined,
                margin: tokenColor ? "1px" : undefined,
            }}
        >
            {value}
        </div>
    );
}

// Utility function for contrast color
const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default WordToken;
