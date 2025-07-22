/**
 * Node Creation Service
 *
 * Handles AI-driven node creation using the existing TokenInteractionContext
 */

import { handleTokenClick } from "../contexts/TokenInteractionContext";
import { Node } from "reactflow";

export interface NodeCreationRequest {
    title: string;
    description: string;
    layout?: number;
    position?: { x: number; y: number };
    parentNodeId?: string;
    boardId: string;
}

export interface NodeCreationResult {
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
    private saveCallback?: () => Promise<void>;

    constructor(
        nodes: Node[],
        setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
        onNodesChange: (changes: any) => void,
        onEdgesChange: (changes: any) => void,
        getLastTwoLayouts: () => number[],
        addLayout: (layout: number) => void,
        saveCallback?: () => Promise<void>
    ) {
        this.nodes = nodes;
        this.setNodes = setNodes;
        this.onNodesChange = onNodesChange;
        this.onEdgesChange = onEdgesChange;
        this.getLastTwoLayouts = getLastTwoLayouts;
        this.addLayout = addLayout;
        this.saveCallback = saveCallback;
    }

    /**
     * Create a knowledge node using the existing token interaction system
     */
    async createKnowledgeNode(
        request: NodeCreationRequest
    ): Promise<NodeCreationResult> {
        try {
            // Find the parent node or use a default position
            let sourceNode: Node;
            let sourcePosition: { x: number; y: number };

            if (request.parentNodeId) {
                const parentNode = this.nodes.find(
                    (n) => n.id === request.parentNodeId
                );
                if (parentNode) {
                    sourceNode = parentNode;
                    sourcePosition = parentNode.position;
                } else {
                    // Parent not found, create at specified position or default
                    sourcePosition = request.position || { x: 400, y: 300 };
                    // Use the first available node as source or create a virtual one
                    sourceNode =
                        this.nodes[0] ||
                        ({
                            id: "virtual-source",
                            position: sourcePosition,
                            data: { myColor: "#3b82f6" },
                        } as Node);
                }
            } else {
                // No parent specified, use specified position or smart positioning
                sourcePosition = request.position || this.getSmartPosition();
                sourceNode =
                    this.nodes[0] ||
                    ({
                        id: "virtual-source",
                        position: sourcePosition,
                        data: { myColor: "#3b82f6" },
                    } as Node);
            }

            // Use handleTokenClick to create the node
            const result = handleTokenClick(
                { word: request.title }, // Token with the title
                sourceNode.id, // Source node ID
                sourcePosition, // Source position
                "draggableEditable", // Source node type
                this.nodes,
                this.setNodes,
                this.onNodesChange,
                this.onEdgesChange,
                sourceNode.data?.myColor, // Source node color
                request.description, // Source node text (context for AI)
                undefined, // suggestion ID
                false, // not an input
                undefined, // input node
                "default", // input mode
                this.saveCallback,
                this.getLastTwoLayouts,
                this.addLayout
            );

            return {
                success: !!result,
                error: result ? undefined : "Failed to create node",
            };
        } catch (error) {
            console.error("Node creation failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Create a concept map node
     */
    async createConceptMap(
        request: NodeCreationRequest
    ): Promise<NodeCreationResult> {
        return this.createKnowledgeNode(request);
    }

    /**
     * Create a flowchart node
     */
    async createFlowchart(
        request: NodeCreationRequest
    ): Promise<NodeCreationResult> {
        return this.createKnowledgeNode(request);
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
