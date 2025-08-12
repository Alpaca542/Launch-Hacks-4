/**
 * Tool Executor Service
 *
 * Handles execution of OpenAI function calls for node creation
 */

import { ToolCall } from "./aiService";
import { handleNodeCreation } from "../contexts/TokenInteractionContext";

interface CreateVisualParams {
    title: string;
    description: string;
    mode: string;
}

interface Position {
    x: number;
    y: number;
}

export const executeTool = async (
    toolCall: ToolCall,
    nodes: any[],
    setNodes: any,
    onNodesChange: any,
    onEdgesChange: any,
    saveCallback?: () => Promise<void>,
    getLastTwoLayouts?: () => number[],
    addLayout?: (layout: number) => void
) => {
    const { function: func } = toolCall;
    const functionName = func.name;

    let parameters;
    try {
        parameters = JSON.parse(func.arguments);
    } catch (error) {
        throw new Error(`Invalid tool arguments: ${func.arguments}`);
    }

    switch (functionName) {
        case "create_visual":
            return await create_visual(
                parameters,
                nodes,
                setNodes,
                onNodesChange,
                onEdgesChange,
                saveCallback,
                getLastTwoLayouts,
                addLayout
            );
        default:
            throw new Error(`Unknown tool: ${functionName}`);
    }
};

const create_visual = async (
    parameters: CreateVisualParams,
    nodes: any[],
    setNodes: any,
    onNodesChange: any,
    onEdgesChange: any,
    saveCallback?: () => Promise<void>,
    getLastTwoLayouts?: () => number[],
    addLayout?: (layout: number) => void
) => {
    const { title, mode } = parameters;

    handleNodeCreation(
        title,
        "1",
        { x: 0, y: 0 } as Position,
        "staticEditable",
        nodes,
        setNodes,
        onNodesChange,
        onEdgesChange,
        mode,
        undefined, // inputNode
        true, // isAIGenerated
        undefined, // sourceNodeColor
        undefined, // sourceNodeLabel
        undefined, // suggestionID
        saveCallback, // saveCallback
        getLastTwoLayouts, // getLastTwoLayouts
        addLayout // addLayout
    );
};

// setNodes([
//     {
//         id: "1",
//         type: "staticEditable",
//         data: {
//             label: boardName || "New Board",
//         },
//         position: { x: 0, y: 0 },
//         draggable: false,
//     },
// ]);
