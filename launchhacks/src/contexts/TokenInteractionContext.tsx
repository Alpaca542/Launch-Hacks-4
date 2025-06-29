import React, { createContext, useContext, useCallback } from "react";
import { Node } from "reactflow";
import {
    generateRandomColor,
    generateColorVariation,
    calculateNewNodePosition,
    createNewNode,
    createNewEdge,
} from "../utils/nodeHelpers";

// Token interface with concept support
export interface Token {
    word: string;
    myConcept?: string;
}

interface TokenInteractionContextType {
    handleTokenClick: (
        token: Token,
        sourceNodeId: string,
        sourceNodePosition: { x: number; y: number },
        sourceNodeType: string,
        sourceNodeColor?: string
    ) => void;
}

const TokenInteractionContext =
    createContext<TokenInteractionContextType | null>(null);

interface TokenInteractionProviderProps {
    children: React.ReactNode;
    nodes: Node[];
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
}

export const TokenInteractionProvider: React.FC<
    TokenInteractionProviderProps
> = ({ children, nodes, onNodesChange, onEdgesChange }) => {
    const handleTokenClick = useCallback(
        (
            token: Token,
            sourceNodeId: string,
            sourceNodePosition: { x: number; y: number },
            sourceNodeType: string,
            sourceNodeColor?: string
        ) => {
            // Check if token is already colored - if so, do nothing
            const checkNode = nodes.find((n) => n.id === sourceNodeId);
            const concept = token.myConcept || token.word;

            // Check if this token/concept is already colored
            const isAlreadyColored = checkNode?.data.tokenColors?.[concept];
            if (isAlreadyColored) {
                console.log("Token/concept already colored, ignoring click");
                return;
            }

            // Determine color based on source node type
            let color: string;
            if (sourceNodeType === "staticEditable") {
                color = generateRandomColor();
            } else {
                color = sourceNodeColor
                    ? generateColorVariation(sourceNodeColor)
                    : generateRandomColor();
            }

            // Calculate position for new node
            const newPosition = calculateNewNodePosition(
                sourceNodePosition,
                nodes
            );

            // Create new node - use concept if it exists, otherwise use word
            const nodeLabel = token.myConcept || token.word;
            const newNode = createNewNode(
                newPosition,
                nodeLabel,
                color,
                sourceNodeType
            );

            // Create new edge
            const newEdge = createNewEdge(sourceNodeId, newNode.id, color);

            // Add the new node and edge
            onNodesChange([{ type: "add", item: newNode }]);
            onEdgesChange([{ type: "add", item: newEdge }]);

            console.log("Coloring concept:", concept, "with color:", color);

            // Find and update the source node to add token color for the concept
            const sourceNode = nodes.find((n) => n.id === sourceNodeId);
            if (sourceNode) {
                const updatedNode = {
                    ...sourceNode,
                    data: {
                        ...sourceNode.data,
                        tokenColors: {
                            ...sourceNode.data.tokenColors,
                            [concept]: color, // Store by concept name
                        },
                    },
                };
                onNodesChange([
                    { type: "replace", id: sourceNodeId, item: updatedNode },
                ]);
            }
        },
        [nodes, onNodesChange, onEdgesChange]
    );

    return (
        <TokenInteractionContext.Provider value={{ handleTokenClick }}>
            {children}
        </TokenInteractionContext.Provider>
    );
};

export const useTokenInteraction = (): TokenInteractionContextType => {
    const context = useContext(TokenInteractionContext);
    if (!context) {
        throw new Error(
            "useTokenInteraction must be used within a TokenInteractionProvider"
        );
    }
    return context;
};
