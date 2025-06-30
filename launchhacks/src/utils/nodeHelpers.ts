import { Node, Edge, MarkerType } from "reactflow";

// Token interface
export interface Token {
    word: string;
    myConcept?: string;
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
    _sourceNodeType: string // Prefix with underscore to indicate unused
): Node => {
    const nodeId = generateNodeId();

    return {
        id: nodeId,
        type: "draggableEditable", // Always create draggable nodes
        position,
        data: {
            label: label,
            summary: summary,
            full_text: full_text,
            myColor: color, // Changed from color to myColor
        },
    };
};

export const createNewEdge = (
    sourceId: string,
    targetId: string,
    color: string
): Edge => {
    return {
        id: generateEdgeId(sourceId, targetId),
        source: sourceId,
        target: targetId,
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

// Utility functions for color manipulation
export const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export const darkenColor = (hexColor: string, percent: number): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const darkerR = Math.max(0, Math.floor(r * (1 - percent / 100)));
    const darkerG = Math.max(0, Math.floor(g * (1 - percent / 100)));
    const darkerB = Math.max(0, Math.floor(b * (1 - percent / 100)));

    return `#${darkerR.toString(16).padStart(2, "0")}${darkerG
        .toString(16)
        .padStart(2, "0")}${darkerB.toString(16).padStart(2, "0")}`;
};
