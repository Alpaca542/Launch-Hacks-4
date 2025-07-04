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
        sourceNodeColor?: string,
        sourceNodeText?: string,
        solutionID?: string
    ) => string | null;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    showExplanation?: (title: string, text: string) => void;
}

const TokenInteractionContext =
    createContext<TokenInteractionContextType | null>(null);

interface TokenInteractionProviderProps {
    children: React.ReactNode;
    nodes: Node[];
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    showExplanation?: (title: string, text: string) => void;
}

export const TokenInteractionProvider: React.FC<
    TokenInteractionProviderProps
> = ({
    children,
    nodes,
    onNodesChange,
    onEdgesChange,
    setNodes,
    showExplanation,
}) => {
    const handleTokenClick = useCallback(
        (
            token: Token,
            sourceNodeId: string,
            sourceNodePosition: { x: number; y: number },
            sourceNodeType: string,
            sourceNodeColor?: string,
            sourceNodeText?: string,
            suggestionID?: string
        ) => {
            // Find the source node to check token colors
            const sourceNode = nodes.find((node) => node.id === sourceNodeId);
            if (!sourceNode) return null;

            // Initialize tokenColors if it doesn't exist
            const tokenColors = sourceNode.data.tokenColors || {};

            // Check if this token is already colored
            const tokenKey = token.myConcept || token.word;
            if (tokenColors[tokenKey]) {
                // Token is already colored, don't allow clicking
                console.log(
                    `Token "${tokenKey}" is already colored, ignoring click`
                );
                return null;
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

            // Update the source node's tokenColors
            const updatedTokenColors = { ...tokenColors };
            if (token.myConcept) {
                // If token is part of a concept, color all tokens in that concept
                updatedTokenColors[token.myConcept] = color;
            } else {
                // Color just this token
                updatedTokenColors[token.word] = color;
            }

            // Update the source node with new token colors
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === sourceNodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                tokenColors: updatedTokenColors,
                            },
                        };
                    }
                    return node;
                })
            );

            // Calculate position for new node
            const newPosition = calculateNewNodePosition(
                sourceNodePosition,
                nodes
            );

            const newNode = createNewNode(
                newPosition,
                "Loading...", // fallback text
                "Loading...", // fallback text
                "Loading...", // fallback text
                color,
                sourceNodeType,
                sourceNodeId // Pass the source node ID as previousNode
            );

            // Add loading indicator flag to node data
            newNode.data.isLoading = true;

            // Create new edge
            const newEdge = createNewEdge(
                sourceNodeId,
                newNode.id,
                color,
                suggestionID
            );

            // Add the new node and edge immediately
            onNodesChange([{ type: "add", item: newNode }]);
            onEdgesChange([{ type: "add", item: newEdge }]);

            // Always ask AI for concept and update node when response arrives
            askAITwice(token.word, sourceNodeText || "")
                .then((response) => {
                    const full_text =
                        response.firstResponse?.response || token.word;
                    const summary =
                        response.secondResponse?.response || token.word;
                    const suggestions = response.thirdResponse?.response || {};
                    // Use setNodes with function to update the specific node
                    // This follows ReactFlow's recommended pattern for updating nodes
                    setNodes((nds) =>
                        nds.map((node) => {
                            if (node.id === newNode.id) {
                                // Create a new node object to notify React Flow about the change
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        label: summary,
                                        title: token.word, // Use the original token as title
                                        summary: summary,
                                        full_text: full_text,
                                        suggestions: suggestions, // Could be populated by AI later
                                        isLoading: false,
                                    },
                                };
                            }
                            return node;
                        })
                    );
                })
                .catch(() => {
                    // Fallback to original word if AI request fails
                    setNodes((nds) =>
                        nds.map((node) => {
                            if (node.id === newNode.id) {
                                // Create a new node object to notify React Flow about the change
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        label: token.word,
                                        title: token.word,
                                        summary: token.word,
                                        full_text: token.word,
                                        suggestions: [],
                                        isLoading: false,
                                    },
                                };
                            }
                            return node;
                        })
                    );
                });

            return color;
        },
        [nodes, onNodesChange, onEdgesChange, setNodes]
    );

    return (
        <TokenInteractionContext.Provider
            value={{ handleTokenClick, setNodes, showExplanation }}
        >
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
