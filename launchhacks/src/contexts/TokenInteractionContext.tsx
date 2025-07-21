import React, { createContext, useContext } from "react";
import { Node } from "reactflow";
import {
    generateRandomColor,
    generateColorVariation,
    calculateNewNodePosition,
    createNewNode,
    createNewEdge,
} from "../utils/nodeHelpers";
import { generateNodeContent } from "../services/aiService";
import { parseLayoutContent } from "../services/layoutParser";

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

export const handleTokenClick = (
    token: Token,
    sourceNodeId: string,
    sourceNodePosition: { x: number; y: number },
    sourceNodeType: string,
    nodes: Node[],
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
    onNodesChange: (changes: any) => void,
    onEdgesChange: (changes: any) => void,
    sourceNodeColor?: string,
    sourceNodeText?: string,
    suggestionID?: string,
    isInput?: boolean,
    inputNode?: Node,
    inputMode?: string,
    showExplanation?: (title: string, text: string) => void
) => {
    console.log(1);
    const sourceNode = nodes.find((node) => node.id === sourceNodeId);
    if (!sourceNode) return null;
    console.log(2);
    // Initialize tokenColors if it doesn't exist
    const tokenColors = sourceNode.data.tokenColors || {};
    console.log(3);
    // Check if this token is already colored
    if (!isInput) {
        const tokenKey = token.myConcept || token.word;
        if (tokenColors[tokenKey]) {
            // Token is already colored, don't allow clicking
            console.log(
                `Token "${tokenKey}" is already colored, ignoring click`
            );
            return null;
        }
    }
    console.log(4);
    // Determine color based on source node type
    let color: string;
    if (sourceNodeType === "staticEditable") {
        color = generateRandomColor();
    } else {
        color = sourceNodeColor
            ? generateColorVariation(sourceNodeColor)
            : generateRandomColor();
    }
    let newNode: Node | null = null;
    if (isInput) {
        newNode = inputNode!;
    } else {
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
        const newPosition = calculateNewNodePosition(sourceNodePosition);

        newNode = createNewNode(
            newPosition,
            token.myConcept || token.word, // Use the token word as initial label
            "Loading...", // full_text placeholder
            "", // Start with empty summary for progressive streaming
            color,
            sourceNodeType,
            sourceNodeId // Pass the source node ID as previousNode
        );
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
    }

    if (newNode) {
        newNode.data.isLoading = true;
        newNode.data.previousNode = sourceNodeId;
    }

    if (isInput) {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === newNode?.id) {
                    return {
                        ...node,
                        data: {
                            ...newNode.data,
                        },
                    };
                }
                return node;
            })
        );
    }

    // Always ask AI for concept and update node when response arrives
    generateNodeContent(
        token.myConcept || token.word,
        sourceNodeText || "",
        inputMode || "default"
    )
        .then(async (result) => {
            // Parse the layout content to HTML
            const { html, mediaPromises } = await parseLayoutContent(
                result.layout,
                result.content,
                newNode?.id || ""
            );

            // Update node with all the generated content
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === newNode?.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                title: result.title,
                                full_text: result.fullText,
                                suggestions: result.suggestions,
                                layout: result.layout,
                                contents: [html], // Store the rendered HTML
                                isLoading: false,
                                icon: result.icon,
                            },
                        };
                    }
                    return node;
                })
            );

            // Execute media loading promises in background
            Promise.all(mediaPromises).catch((error) => {
                console.warn("Some media failed to load:", error);
            });
        })
        .catch((error) => {
            console.error("Error generating node content:", error);
            // Fallback to original word if AI request fails
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === newNode?.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                title: token.word,
                                full_text: token.word,
                                suggestions: [],
                                layout: 1,
                                contents: [
                                    `<div class="error-content">Failed to load content for "${token.word}"</div>`,
                                ],
                                isLoading: false,
                                icon: "❌",
                            },
                        };
                    }
                    return node;
                })
            );
        });

    return color;
};

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
    // Replace local handleTokenClick with a wrapper that calls the exported function
    const handleTokenClickWrapper = (
        token: Token,
        sourceNodeId: string,
        sourceNodePosition: { x: number; y: number },
        sourceNodeType: string,
        sourceNodeColor?: string,
        sourceNodeText?: string,
        solutionID?: string,
        isInput?: boolean,
        inputNode?: Node,
        inputMode?: string
    ) =>
        handleTokenClick(
            token,
            sourceNodeId,
            sourceNodePosition,
            sourceNodeType,
            nodes,
            setNodes,
            onNodesChange,
            onEdgesChange,
            sourceNodeColor,
            sourceNodeText,
            solutionID,
            isInput,
            inputNode,
            inputMode,
            showExplanation
        );

    return (
        <TokenInteractionContext.Provider
            value={{
                handleTokenClick: handleTokenClickWrapper,
                setNodes,
                showExplanation,
            }}
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
