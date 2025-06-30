import { Node, Edge, MarkerType } from "reactflow";

// Token interface
export interface Token {
    word: string;
    myConcept?: string;
    suggestionId?: string;
}

// Parse text into tokens with concept information
export const parseTextIntoTokens = (text: string): Token[] => {
    const tokens: Token[] = [];
    const parts = text.split("_");

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            // Regular text - split into words
            const words = parts[i]
                .split(/\s+/)
                .filter((word) => word.trim() !== "");
            words.forEach((word) => {
                tokens.push({ word: word.trim() });
            });
        } else {
            // Concept text - each word belongs to this concept
            const conceptName = parts[i].trim();
            const words = conceptName
                .split(/\s+/)
                .filter((word) => word.trim() !== "");
            words.forEach((word) => {
                tokens.push({
                    word: word.trim(),
                    myConcept: conceptName,
                });
            });
        }
    }

    return tokens;
};

// Color utilities
export const generateRandomColor = (): string => {
    const colors = [
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#45B7D1", // Blue
        "#96CEB4", // Green
        "#FFEAA7", // Yellow
        "#DDA0DD", // Plum
        "#98D8C8", // Mint
        "#F7DC6F", // Light Yellow
        "#BB8FCE", // Light Purple
        "#85C1E9", // Light Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return "#000000";
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
};

export const darkenColor = (hexColor: string, amount: number): string => {
    if (!hexColor) return "#000000";
    let color = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
    const f = parseInt(color, 16);
    const t = amount < 0 ? 0 : 255;
    const p = amount < 0 ? amount * -1 : amount;
    const R = f >> 16;
    const G = (f >> 8) & 0x00ff;
    const B = f & 0x0000ff;
    const newR = Math.round((t - R) * p) + R;
    const newG = Math.round((t - G) * p) + G;
    const newB = Math.round((t - B) * p) + B;
    return `#${(0x1000000 + newR * 0x10000 + newG * 0x100 + newB)
        .toString(16)
        .slice(1)}`;
};

export const generateColorVariation = (baseColor: string): string => {
    // Convert hex to RGB
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create variation by adjusting brightness
    const variation = 30;
    const newR = Math.min(
        255,
        Math.max(0, r + (Math.random() - 0.5) * variation * 2)
    );
    const newG = Math.min(
        255,
        Math.max(0, g + (Math.random() - 0.5) * variation * 2)
    );
    const newB = Math.min(
        255,
        Math.max(0, b + (Math.random() - 0.5) * variation * 2)
    );

    // Convert back to hex
    return `#${Math.round(newR).toString(16).padStart(2, "0")}${Math.round(newG)
        .toString(16)
        .padStart(2, "0")}${Math.round(newB).toString(16).padStart(2, "0")}`;
};

// Node positioning utilities
export const calculateNewNodePosition = (
    sourceNodePosition: { x: number; y: number },
    existingNodes: Node[]
): { x: number; y: number } => {
    const baseOffset = 200;
    const searchRadius = 150;

    // Try different angles to find a position that doesn't overlap
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];

    for (const angle of angles) {
        const radian = (angle * Math.PI) / 180;
        const newX = sourceNodePosition.x + Math.cos(radian) * baseOffset;
        const newY = sourceNodePosition.y + Math.sin(radian) * baseOffset;

        // Check if this position is too close to existing nodes
        const hasOverlap = existingNodes.some((node) => {
            const distance = Math.sqrt(
                Math.pow(node.position.x - newX, 2) +
                    Math.pow(node.position.y - newY, 2)
            );
            return distance < searchRadius;
        });

        if (!hasOverlap) {
            return { x: newX, y: newY };
        }
    }

    // If all positions have overlaps, just use the first one with a random offset
    const randomAngle = Math.random() * 2 * Math.PI;
    return {
        x:
            sourceNodePosition.x +
            Math.cos(randomAngle) * (baseOffset + Math.random() * 100),
        y:
            sourceNodePosition.y +
            Math.sin(randomAngle) * (baseOffset + Math.random() * 100),
    };
};

// Generate unique IDs
export const generateNodeId = (): string => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateEdgeId = (sourceId: string, targetId: string): string => {
    return `edge_${sourceId}_${targetId}`;
};

// Node creation utilities
export const createNewNode = (
    position: { x: number; y: number },
    label: string,
    full_text: string,
    summary: string,
    color: string,
    _sourceNodeType: string, // Prefix with underscore to indicate unused
    previousNodeId: string // ID of the node that created this one
): Node => {
    const nodeId = generateNodeId();

    return {
        id: nodeId,
        type: "draggableEditable", // Always create draggable nodes
        position,
        draggable: true, // Explicitly set draggable property
        data: {
            label: label,
            title: label, // Use label as default title
            summary: summary,
            full_text: full_text,
            suggestions: [], // Initialize with empty suggestions
            myColor: color, // Changed from color to myColor
            tokenColors: {}, // Initialize empty token colors
            previousNode: previousNodeId, // Track which node created this one
        },
    };
};

export const createNewEdge = (
    sourceId: string,
    targetId: string,
    color: string,
    suggestionId?: string
): Edge => {
    return {
        id: generateEdgeId(sourceId, targetId),
        source: sourceId,
        target: targetId,
        sourceHandle: suggestionId, // Explicitly set to null instead of undefined
        targetHandle: null, // Explicitly set to null instead of undefined
        style: {
            stroke: color,
            strokeWidth: 3,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
        },
    };
};
