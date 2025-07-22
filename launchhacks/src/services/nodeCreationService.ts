/**
 * Node Creation Service
 *
 * Handles AI-driven node creation with intelligent positioning and content generation
 */

import { generateNodeContent } from "./aiService";
import { generateNodeId, calculateNewNodePosition } from "../utils/nodeHelpers";
import { Node, Edge } from "reactflow";

export interface NodeCreationRequest {
    title: string;
    description: string;
    layout?: number;
    position?: { x: number; y: number };
    parentNodeId?: string;
    boardId: string;
}

export interface NodeCreationResult {
    node: Node;
    edge?: Edge;
    success: boolean;
    error?: string;
}

export class NodeCreationService {
    private nodes: Node[];
    private setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    private onNodesChange: (changes: any) => void;
    private onEdgesChange: (changes: any) => void;
    private getLastTwoLayouts: () => number[];
    private addLayout: (layout: number) => void;

    constructor(
        nodes: Node[],
        setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
        onNodesChange: (changes: any) => void,
        onEdgesChange: (changes: any) => void,
        getLastTwoLayouts: () => number[],
        addLayout: (layout: number) => void
    ) {
        this.nodes = nodes;
        this.setNodes = setNodes;
        this.onNodesChange = onNodesChange;
        this.onEdgesChange = onEdgesChange;
        this.getLastTwoLayouts = getLastTwoLayouts;
        this.addLayout = addLayout;
    }

    /**
     * Create a knowledge node with AI-generated content
     */
    async createKnowledgeNode(
        request: NodeCreationRequest
    ): Promise<NodeCreationResult> {
        try {
            const nodeId = generateNodeId();
            let position = request.position;
            let parentNode: Node | undefined;

            // Find parent node if specified
            if (request.parentNodeId) {
                parentNode = this.nodes.find(
                    (n) => n.id === request.parentNodeId
                );
                if (parentNode && !position) {
                    position = calculateNewNodePosition(parentNode.position);
                }
            }

            // Default position if none provided
            if (!position) {
                position = {
                    x: Math.random() * 400 + 100,
                    y: Math.random() * 300 + 100,
                };
            }

            // Create initial node
            const initialNode: Node = {
                id: nodeId,
                type: "draggableEditable",
                position,
                draggable: true,
                data: {
                    label: request.title,
                    title: request.title,
                    full_text: request.description,
                    suggestions: [],
                    isLoading: true,
                    myColor: parentNode?.data?.myColor || "#3b82f6",
                    previousNode: request.parentNodeId || null,
                    tokenColors: {},
                },
            };

            // Add node immediately
            this.onNodesChange([{ type: "add", item: initialNode }]);

            // Create edge if parent exists
            let edge: Edge | undefined;
            if (parentNode && request.parentNodeId) {
                edge = {
                    id: `edge_${request.parentNodeId}_${nodeId}`,
                    source: request.parentNodeId,
                    target: nodeId,
                    style: {
                        stroke: parentNode.data?.myColor || "#3b82f6",
                        strokeWidth: 3,
                    },
                    markerEnd: {
                        type: "arrowclosed" as any,
                        color: parentNode.data?.myColor || "#3b82f6",
                    },
                };
                this.onEdgesChange([{ type: "add", item: edge }]);
            }

            // Generate AI content
            const lastTwoLayouts = this.getLastTwoLayouts();
            const aiResult = await generateNodeContent(
                request.title,
                request.description,
                "default",
                lastTwoLayouts
            );

            // Track layout
            this.addLayout(aiResult.layout);

            // Update node with AI content
            this.setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                title: aiResult.title,
                                full_text: aiResult.fullText,
                                suggestions: aiResult.suggestions,
                                layout: aiResult.layout,
                                contents: aiResult.content,
                                isLoading: false,
                                icon: aiResult.icon,
                            },
                        };
                    }
                    return node;
                })
            );

            return {
                node: initialNode,
                edge,
                success: true,
            };
        } catch (error) {
            console.error("Node creation failed:", error);
            return {
                node: {} as Node,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Create a concept map node with specific layout
     */
    async createConceptMap(
        request: NodeCreationRequest
    ): Promise<NodeCreationResult> {
        return this.createKnowledgeNode({
            ...request,
            layout: 4, // Mind map layout
        });
    }

    /**
     * Create a flowchart node
     */
    async createFlowchart(
        request: NodeCreationRequest
    ): Promise<NodeCreationResult> {
        return this.createKnowledgeNode({
            ...request,
            layout: 3, // Flowchart layout
        });
    }

    /**
     * Get intelligent positioning suggestions based on existing nodes
     */
    getSmartPosition(centerPoint?: { x: number; y: number }): {
        x: number;
        y: number;
    } {
        if (!centerPoint) {
            // Find center of existing nodes
            if (this.nodes.length > 0) {
                const avgX =
                    this.nodes.reduce((sum, node) => sum + node.position.x, 0) /
                    this.nodes.length;
                const avgY =
                    this.nodes.reduce((sum, node) => sum + node.position.y, 0) /
                    this.nodes.length;
                centerPoint = { x: avgX, y: avgY };
            } else {
                centerPoint = { x: 400, y: 300 };
            }
        }

        // Find empty space around center
        const radius = 200;
        const angle = Math.random() * 2 * Math.PI;

        return {
            x: centerPoint.x + Math.cos(angle) * radius,
            y: centerPoint.y + Math.sin(angle) * radius,
        };
    }

    /**
     * Update internal nodes reference
     */
    updateNodes(nodes: Node[]) {
        this.nodes = nodes;
    }
}
