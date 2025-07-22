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
}

const TokenInteractionContext =
    createContext<TokenInteractionContextType | null>(null);

interface TokenInteractionProviderProps {
    children: React.ReactNode;
    nodes: Node[];
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    saveCallback?: () => Promise<void>;
    getLastTwoLayouts?: () => number[];
    addLayout?: (layout: number) => void;
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
    saveCallback?: () => Promise<void>,
    getLastTwoLayouts?: () => number[],
    addLayout?: (layout: number) => void
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
    const lastTwoLayouts = getLastTwoLayouts ? getLastTwoLayouts() : [];

    generateNodeContent(
        token.myConcept || token.word,
        sourceNodeText || "",
        inputMode || "default",
        lastTwoLayouts
    )
        .then(async (result) => {
            console.log("AI Response received:", result);
            console.log("Selected layout:", result.layout);
            console.log("Content array:", result.content);

            // Track the layout that was chosen
            if (addLayout) {
                addLayout(result.layout);
            }

            // Parse the layout content to HTML (now waits for all media to load)
            const { html } = await parseLayoutContent(
                result.layout,
                result.content,
                newNode?.id || ""
            );

            console.log(
                "Layout HTML generated (first 500 chars):",
                html.substring(0, 500)
            );
            console.log("Layout HTML full length:", html.length);

            // Update node with all the generated content
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === newNode?.id) {
                        const updatedNode = {
                            ...node,
                            data: {
                                ...node.data,
                                title: result.title,
                                full_text: result.fullText,
                                suggestions: result.suggestions,
                                layout: result.layout,
                                contents: [html], // Store the rendered HTML with loaded media
                                isLoading: false,
                                icon: result.icon,
                            },
                        };
                        console.log("Updated node data:", updatedNode.data);
                        return updatedNode;
                    }
                    return node;
                })
            );

            // Save the new node content after AI processing completes
            if (saveCallback) {
                try {
                    await saveCallback();
                } catch (error) {
                    console.error("Error saving new node content:", error);
                }
            }
        })
        .catch(async (error) => {
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

            // Save even in error case
            if (saveCallback) {
                try {
                    await saveCallback();
                } catch (saveError) {
                    console.error(
                        "Error saving new node content after error:",
                        saveError
                    );
                }
            }
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
    saveCallback,
    getLastTwoLayouts,
    addLayout,
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
            saveCallback,
            getLastTwoLayouts,
            addLayout
        );

    return (
        <TokenInteractionContext.Provider
            value={{
                handleTokenClick: handleTokenClickWrapper,
                setNodes,
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
