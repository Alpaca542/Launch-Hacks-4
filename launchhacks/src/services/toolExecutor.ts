/**
 * Tool Executor Service
 *
 * Handles execution of OpenAI function calls for node creation
 */

import { ToolCall } from "./aiService";
import {
    NodeCreationService,
    NodeCreationRequest,
} from "./nodeCreationService";

export class ToolExecutor {
    public nodeCreationService: NodeCreationService;

    constructor(nodeCreationService: NodeCreationService) {
        this.nodeCreationService = nodeCreationService;
    }

    /**
     * Execute a tool call from OpenAI
     */
    async executeTool(toolCall: ToolCall): Promise<string> {
        const { function: func } = toolCall;
        const functionName = func.name;

        let parameters;
        try {
            parameters = JSON.parse(func.arguments);
        } catch (error) {
            throw new Error(`Invalid tool arguments: ${func.arguments}`);
        }

        switch (functionName) {
            case "create_knowledge_node":
                return await this.createKnowledgeNode(parameters);

            case "create_concept_map":
                return await this.createConceptMap(parameters);

            case "create_flowchart":
                return await this.createFlowchart(parameters);

            default:
                throw new Error(`Unknown tool: ${functionName}`);
        }
    }

    private async createKnowledgeNode(parameters: any): Promise<string> {
        const request: NodeCreationRequest = {
            title: parameters.title,
            description: parameters.description,
            layout: parameters.layout,
            position: parameters.position,
            parentNodeId: parameters.parentNodeId,
            boardId: "current", // This will be set by the calling component
        };

        const result = await this.nodeCreationService.createKnowledgeNode(
            request
        );

        if (result.success) {
            return `Created knowledge node: "${parameters.title}"`;
        } else {
            throw new Error(result.error || "Failed to create knowledge node");
        }
    }

    private async createConceptMap(parameters: any): Promise<string> {
        const request: NodeCreationRequest = {
            title: parameters.title,
            description: parameters.description,
            layout: 4, // Mind map layout
            parentNodeId: parameters.parentNodeId,
            boardId: "current",
        };

        const result = await this.nodeCreationService.createConceptMap(request);

        if (result.success) {
            return `Created concept map: "${parameters.title}"`;
        } else {
            throw new Error(result.error || "Failed to create concept map");
        }
    }

    private async createFlowchart(parameters: any): Promise<string> {
        const request: NodeCreationRequest = {
            title: parameters.title,
            description: parameters.description,
            layout: 3, // Flowchart layout
            parentNodeId: parameters.parentNodeId,
            boardId: "current",
        };

        const result = await this.nodeCreationService.createFlowchart(request);

        if (result.success) {
            return `Created flowchart: "${parameters.title}"`;
        } else {
            throw new Error(result.error || "Failed to create flowchart");
        }
    }

    /**
     * Get available parent nodes for connection
     */
    getAvailableParentNodes(): { id: string; title: string }[] {
        // This could be enhanced to return actual available nodes
        // For now, the node creation service handles positioning automatically
        return [];
    }
}
