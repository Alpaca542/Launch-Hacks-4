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
import { processQuizHTML } from "../services/quizParser";
interface NodeCreationContextType {
    handleNodeCreation: (
        content: string,
        sourceNodeId: string,
        sourceNodePosition: { x: number; y: number },
        sourceNodeType: string,
        sourceNodeColor?: string,
        sourceNodeLabel?: string,
        suggestionID?: string
    ) => string | null;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
}

const NodeCreationContext = createContext<NodeCreationContextType | null>(null);

interface NodeCreationProviderProps {
    children: React.ReactNode;
    nodes: Node[];
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    saveCallback?: () => Promise<void>;
    getLastTwoLayouts?: () => number[];
    addLayout?: (layout: number) => void;
}

export const handleNodeCreation = (
    content: string,
    sourceNodeId: string,
    sourceNodePosition: { x: number; y: number },
    sourceNodeType: string,
    nodes: Node[],
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
    onNodesChange: (changes: any) => void,
    onEdgesChange: (changes: any) => void,
    inputMode: string,
    inputNode?: Node,
    isAIGenerated: boolean = false,
    sourceNodeColor?: string,
    sourceNodeLabel?: string,
    suggestionID?: string,
    saveCallback?: () => Promise<void>,
    getLastTwoLayouts?: () => number[],
    addLayout?: (layout: number) => void,
    customLabel?: string,
    isQuiz: boolean = false
) => {
    const sourceNode = nodes.find((node) => node.id === sourceNodeId);
    if (!sourceNode) return null;

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

    if (!isAIGenerated) {
        newNode = inputNode!;
    } else {
        // Calculate position for new node
        const newPosition = calculateNewNodePosition(sourceNodePosition);

        newNode = createNewNode(
            newPosition,
            customLabel || content,
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

    if (!isAIGenerated) {
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

    // Generate content for the new node
    const lastTwoLayouts = getLastTwoLayouts ? getLastTwoLayouts() : [];
    generateNodeContent(
        content,
        sourceNodeLabel || "",
        inputMode || "default",
        lastTwoLayouts,
        isQuiz
    )
        .then(async (result) => {
            console.log("AI Response received:", result);
            console.log("Selected layout:", result.layout);
            console.log("Content array:", result.content);
            const html: string =
                result.layout > -1
                    ? await (async () => {
                          if (addLayout) {
                              // Track the layout that was chosen
                              addLayout(result.layout);
                          }
                          // Parse the layout content to HTML (now waits for all media to load)
                          const layoutResult = await parseLayoutContent(
                              result.layout,
                              result.content,
                              newNode?.id || ""
                          );
                          return layoutResult.html;
                      })()
                    : processQuizHTML(JSON.parse(result.content[0]));

            // Update node with all the generated content
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === newNode?.id) {
                        const updatedNode = {
                            ...node,
                            data: {
                                ...node.data,
                                title: customLabel || content,
                                full_text: result.fullText,
                                suggestions: result.suggestions,
                                layout: result.layout,
                                contents: [html], // Store the rendered HTML with loaded media
                                isLoading: false,
                                icon: result.icon,
                                isQuiz: isQuiz,
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
            // Fallback to original content if AI request fails
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === newNode?.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                title: customLabel || content,
                                full_text: content,
                                suggestions: [],
                                layout: 1,
                                contents: [
                                    `<div class="error-content">Failed to load content for "${content}"</div>`,
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

export const NodeCreationProvider: React.FC<NodeCreationProviderProps> = ({
    children,
    nodes,
    onNodesChange,
    onEdgesChange,
    setNodes,
    saveCallback,
    getLastTwoLayouts,
    addLayout,
}) => {
    // Create a wrapper that calls the exported handleNodeCreation function
    const handleNodeCreationWrapper = (
        content: string,
        sourceNodeId: string,
        sourceNodePosition: { x: number; y: number },
        sourceNodeType: string,
        sourceNodeColor?: string,
        sourceNodeLabel?: string,
        suggestionID?: string,
        isInput?: boolean,
        inputNode?: Node,
        inputMode?: string
    ) =>
        handleNodeCreation(
            content,
            sourceNodeId,
            sourceNodePosition,
            sourceNodeType,
            nodes,
            setNodes,
            onNodesChange,
            onEdgesChange,
            inputMode || "default",
            inputNode,
            !isInput,
            sourceNodeColor,
            sourceNodeLabel,
            suggestionID,
            saveCallback,
            getLastTwoLayouts,
            addLayout
        );

    return (
        <NodeCreationContext.Provider
            value={{
                handleNodeCreation: handleNodeCreationWrapper,
                setNodes,
            }}
        >
            {children}
        </NodeCreationContext.Provider>
    );
};

export const useNodeCreation = (): NodeCreationContextType => {
    const context = useContext(NodeCreationContext);
    if (!context) {
        throw new Error(
            "useNodeCreation must be used within a NodeCreationProvider"
        );
    }
    return context;
};
