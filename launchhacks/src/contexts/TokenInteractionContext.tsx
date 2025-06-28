import React, { createContext, useContext, useCallback } from "react";
import { Node, useReactFlow } from "reactflow";
import {
    generateRandomColor,
    generateColorVariation,
    calculateNewNodePosition,
    createNewNode,
    createNewEdge,
} from "../utils/nodeHelpers";

interface TokenInteractionContextType {
    handleTokenClick: (
        tokenValue: string,
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
    const { setNodes } = useReactFlow();

    const handleTokenClick = useCallback(
        (
            tokenValue: string,
            sourceNodeId: string,
            sourceNodePosition: { x: number; y: number },
            sourceNodeType: string,
            sourceNodeColor?: string
        ) => {
            // Step 3 & 4: Determine color based on source node type
            let color: string;
            if (sourceNodeType === "staticEditable") {
                // Static node - generate random color
                color = generateRandomColor();
            } else {
                // Dynamic node - use color variation
                color = sourceNodeColor
                    ? generateColorVariation(sourceNodeColor)
                    : generateRandomColor();
            }

            // Step 1: Calculate position for new node
            const newPosition = calculateNewNodePosition(
                sourceNodePosition,
                nodes
            );

            // Step 1: Create new node
            const newNode = createNewNode(
                newPosition,
                tokenValue,
                color,
                sourceNodeType
            );

            // Step 2: Create new edge
            const newEdge = createNewEdge(sourceNodeId, newNode.id, color);

            // Add the new node and edge
            onNodesChange([{ type: "add", item: newNode }]);
            onEdgesChange([{ type: "add", item: newEdge }]);

            // Step 5: Update the token color by updating the source node
            console.log(
                "Updating token color for:",
                tokenValue,
                "with color:",
                color
            );
            setNodes((currentNodes) =>
                currentNodes.map((node) =>
                    node.id === sourceNodeId
                        ? {
                              ...node,
                              data: {
                                  ...node.data,
                                  tokenColors: {
                                      ...node.data.tokenColors,
                                      [tokenValue]: color,
                                  },
                              },
                          }
                        : node
                )
            );
        },
        [nodes, onNodesChange, onEdgesChange, setNodes]
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
