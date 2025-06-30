import React, { createContext, useContext, useCallback } from "react";
import { Node } from "reactflow";
import {
    generateRandomColor,
    generateColorVariation,
    calculateNewNodePosition,
    createNewNode,
    createNewEdge,
} from "../utils/nodeHelpers";
import { askAITwice } from "../services";
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
    ) => string;
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
            // Create initial node with loading state
            const loadingLabel = "Loading concept...";
            const newNode = createNewNode(
                newPosition,
                loadingLabel,
                loadingLabel,
                loadingLabel,
                color,
                sourceNodeType
            );

            // Create new edge
            const newEdge = createNewEdge(sourceNodeId, newNode.id, color);

            // Add the new node and edge immediately
            onNodesChange([{ type: "add", item: newNode }]);
            onEdgesChange([{ type: "add", item: newEdge }]);

            // Always ask AI for concept and update node when response arrives
            askAITwice(token.word)
                .then((response) => {
                    const concept =
                        response.secondResponse?.message ||
                        response.firstResponse?.message ||
                        token.word;
                    onNodesChange([
                        {
                            type: "change",
                            id: newNode.id,
                            item: {
                                ...newNode,
                                data: {
                                    ...newNode.data,
                                    label: concept,
                                },
                            },
                        },
                    ]);
                })
                .catch(() => {
                    // Fallback to original word if AI request fails
                    onNodesChange([
                        {
                            type: "change",
                            id: newNode.id,
                            item: {
                                ...newNode,
                                data: { ...newNode.data, label: token.word },
                            },
                        },
                    ]);
                });

            return color;
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
