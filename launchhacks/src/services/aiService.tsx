/**
 * AI Service Module
 *
 * Handles all AI interactions for generating educational content including:
 * - Content suggestions and recommendations
 * - Layout selection and optimization
 * - Icon generation for visual representation
 * - Structured content generation with schema validation
 *
 * Uses Firebase Cloud Functions with Groq for fast, reliable AI responses.
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // Adjust path to your Firebase config
import { jsonrepair } from "jsonrepair";
import {
    suggestionsPrompt,
    iconPrompt,
    layoutPrompt,
    contentPrompt,
    quizPrompt,
} from "./prompts";

// Helper function to clean AI responses that might have markdown formatting
const cleanJsonResponse = (response: string): string => {
    try {
        // Remove markdown code blocks
        let cleaned = response
            .replace(/```json\s*\n?/gi, "")
            .replace(/```\s*$/gi, "");

        // Remove any leading/trailing whitespace
        cleaned = cleaned.trim();

        // If response starts with text before JSON, try to extract just the JSON
        const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        // Try to repair the JSON if it's malformed
        const repairedJson = jsonrepair(cleaned);
        return repairedJson;
    } catch (error) {
        console.warn("Failed to repair JSON:", error);
        console.warn("Original response:", response);
        // Return the cleaned response as fallback
        let cleaned = response
            .replace(/```json\s*\n?/gi, "")
            .replace(/```\s*$/gi, "")
            .trim();

        const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        return jsonMatch ? jsonMatch[0] : cleaned;
    }
};

const askAI = async (message: string): Promise<any> => {
    try {
        // Add validation
        if (!message || typeof message !== "string") {
            throw new Error("Message must be a non-empty string");
        }

        // Trim whitespace and check if message is empty after trimming
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            throw new Error("Message cannot be empty or just whitespace");
        }

        const groqChatFunction = httpsCallable(functions, "groqChat");
        const result = await groqChatFunction({
            message: trimmedMessage,
        });
        console.log("groqChat response:", result.data);
        return (result.data as any).response;
    } catch (err) {
        console.error("Firebase function error:", err);
        console.error("Message sent:", message);
        throw err;
    }
};

// Tool definitions for OpenAI function calling
export interface OpenAITool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required: string[];
        };
    };
}

export interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}

export interface AIStreamOptions {
    enableTools?: boolean;
    availableTools?: OpenAITool[];
    onToolCall?: (toolCall: ToolCall) => Promise<string>;
    currentBoardId?: string;
}

// Define available tools for node creation
export const NODE_CREATION_TOOLS: OpenAITool[] = [
    {
        type: "function",
        function: {
            name: "create_visual",
            description:
                "Creates a detailed knowledge node with AI-generated content about a specific topic",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "The title for the content node",
                    },
                    description: {
                        type: "string",
                        description:
                            "A brief description or context for the node's content",
                    },
                    mode: {
                        type: "string",
                        description:
                            "The mode for the node, choose one of 'default', 'argue', 'explain', 'answer'",
                    },
                },
                required: ["title", "description"],
            },
        },
    },
];

export const askAIStream = async (
    message: string,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
    options?: AIStreamOptions
): Promise<void> => {
    try {
        // Add validation
        if (!message || typeof message !== "string") {
            throw new Error("Message must be a non-empty string");
        }

        // Trim whitespace and check if message is empty after trimming
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            throw new Error("Message cannot be empty or just whitespace");
        }

        // Prepare the message payload for the Firebase function
        const payload: any = {
            message: trimmedMessage,
        };

        // Add tools if enabled
        if (options?.enableTools && options?.availableTools) {
            payload.tools = options.availableTools;
            payload.tool_choice = "auto"; // Let OpenAI decide when to use tools
        }

        console.log("Calling Firebase function with payload:", {
            ...payload,
            tools: payload.tools ? `${payload.tools.length} tools` : "no tools",
        });

        // Create the callable function with streaming support
        const openaiChatFunction = httpsCallable(functions, "groqChat");

        try {
            console.log("Starting streaming request...");
            // Use Firebase callable function streaming - following the official pattern
            const { stream, data } = await openaiChatFunction.stream(payload);

            console.log("Stream started, waiting for chunks...");
            let fullResponse = "";

            // The `stream` async iterable will yield a new value every time
            // the callable function calls `sendChunk()`
            for await (const chunk of stream) {
                console.log("Received chunk:", chunk);
                // The chunk is the data sent directly from response.sendChunk()
                if (
                    chunk &&
                    typeof chunk === "object" &&
                    "type" in chunk &&
                    "content" in chunk
                ) {
                    const typedChunk = chunk as {
                        type: string;
                        content: string;
                    };
                    console.log("Processing chunk:", typedChunk);
                    if (typedChunk.type === "chunk" && typedChunk.content) {
                        fullResponse += typedChunk.content;
                        onChunk(typedChunk.content);
                    }
                }
            }

            // The `data` promise resolves when the callable function completes
            console.log("Waiting for final result...");
            const finalResult = await data;
            console.log("Final result received:", finalResult);

            // Handle the final response
            if (finalResult) {
                const responseData = finalResult as any;
                console.log("Response data structure:", {
                    hasResponse: !!responseData.response,
                    hasToolCalls: !!responseData.tool_calls?.length,
                    toolCallsCount: responseData.tool_calls?.length || 0,
                    keys: Object.keys(responseData),
                });

                // Handle tool calls if they exist
                if (
                    responseData.tool_calls &&
                    responseData.tool_calls.length > 0 &&
                    options?.onToolCall
                ) {
                    console.log(
                        "Processing tool calls:",
                        responseData.tool_calls
                    );
                    for (const toolCall of responseData.tool_calls) {
                        try {
                            onChunk(
                                `\n🔧 Using ${toolCall.function.name}...\n`
                            );
                            const toolResult = await options.onToolCall(
                                toolCall
                            );
                            onChunk(`✅ ${toolResult}\n`);
                        } catch (toolError) {
                            console.error("Tool execution error:", toolError);
                            onChunk(`❌ Tool execution failed: ${toolError}\n`);
                        }
                    }
                }

                if (onComplete) {
                    onComplete();
                }
            } else {
                console.error("No final result received");
                throw new Error(
                    "No final result received from Firebase function"
                );
            }
        } catch (functionError: any) {
            console.error("Firebase function call failed:", functionError);

            // Provide more specific error messages
            let errorMessage =
                "I'm having trouble connecting to the AI service. ";

            if (functionError.code === "functions/not-found") {
                errorMessage +=
                    "The chat function is not available. Please ensure the Firebase function is deployed.";
            } else if (functionError.code === "functions/unavailable") {
                errorMessage +=
                    "The service is temporarily unavailable. Please try again in a moment.";
            } else if (functionError.code === "functions/unauthenticated") {
                errorMessage += "Please sign in to use the chat feature.";
            } else if (functionError.code === "functions/permission-denied") {
                errorMessage +=
                    "You don't have permission to use this feature.";
            } else if (functionError.code === "functions/internal") {
                errorMessage +=
                    "There was an internal server error. Please try again.";
            } else if (functionError.message) {
                errorMessage += `Error: ${functionError.message}`;
            } else {
                errorMessage +=
                    "Please check your internet connection and try again.";
            }

            onChunk(errorMessage);

            if (onError) {
                onError(new Error(errorMessage));
            }
            if (onComplete) {
                onComplete();
            }
        }
    } catch (err) {
        console.error("AI Stream error:", err);
        const errorMessage =
            err instanceof Error ? err.message : "An unexpected error occurred";
        onChunk(`Sorry, there was an error: ${errorMessage}`);
        if (onError) {
            onError(
                err instanceof Error ? err : new Error("Unknown error occurred")
            );
        }
        if (onComplete) {
            onComplete();
        }
    }
};

export const askAIForQuizContent = async (message: string): Promise<string> => {
    try {
        const response = await askAI(quizPrompt(message));
        console.log("Quiz response:", response);
        return response || "✨";
    } catch (error) {
        console.error("Error fetching icon:", error);
        return "✨";
    }
};

export const askAiForSuggestions = async (
    message: string
): Promise<string[]> => {
    try {
        const response = await askAI(suggestionsPrompt(message, "default"));
        console.log("Suggestions response:", response);
        const cleanedResponse = cleanJsonResponse(response);

        try {
            const parsed = JSON.parse(cleanedResponse);
            return Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
            console.warn(
                "JSON parse failed for suggestions, attempting repair:",
                parseError
            );
            // Try direct jsonrepair as a last resort
            const repairedJson = jsonrepair(response);
            const parsed = JSON.parse(repairedJson);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
    }
};

export const askAIForIcon = async (message: string): Promise<string> => {
    try {
        const response = await askAI(iconPrompt(message, "default"));
        console.log("Icon response:", response);
        return response || "✨";
    } catch (error) {
        console.error("Error fetching icon:", error);
        return "✨";
    }
};

export const askAiForLayout = async (
    message: string,
    lastTwoLayouts: number[] = []
): Promise<number> => {
    try {
        const response = await askAI(
            layoutPrompt(message, "default", lastTwoLayouts)
        );
        console.log("Layout response:", response);
        // Clean the response to extract just the number
        const cleanedResponse = response.replace(/[^\d]/g, "");
        const layoutNumber = parseInt(cleanedResponse);

        // Validate the layout number is within expected range
        if (isNaN(layoutNumber) || layoutNumber < 1 || layoutNumber > 18) {
            console.warn(
                `Invalid layout number: ${layoutNumber}, defaulting to 1`
            );
            return 1;
        }

        return layoutNumber;
    } catch (error) {
        console.error("Error fetching layout:", error);
        return 1;
    }
};

/**
 * Generate diagram description - what should be shown in the diagram
 */
const askAiForDiagramDescription = async (
    message: string,
    context: string,
    layoutNumber: number
): Promise<string> => {
    try {
        const diagramTypes = {
            3: "flowchart/process diagram",
            4: "mind map/concept map",
            5: "pie chart/data visualization",
            6: "quadrant chart/strategic framework",
        };

        const diagramType =
            diagramTypes[layoutNumber as keyof typeof diagramTypes] ||
            "diagram";

        const prompt = `You are creating educational content. Generate a detailed description of what should be shown in a ${diagramType} for the concept: "${message}".

Context: ${context}

Requirements:
- Describe the key elements that should appear in the diagram
- Explain the relationships between elements
- Specify the main flow or structure
- Include 3-5 key components/nodes
- Keep description comprehensive but focused (100-150 words)
- Write in a clear, educational tone

Return ONLY the description text, no JSON formatting or extra text.`;

        const response = await askAI(prompt);
        return response || `Description for ${diagramType} showing ${message}`;
    } catch (error) {
        console.error("Error fetching diagram description:", error);
        return `Educational diagram showing ${message}`;
    }
};

/**
 * Generate actual Mermaid diagram string based on description
 */
const askAiForMermaidDiagram = async (
    message: string,
    context: string,
    layoutNumber: number,
    diagramDescription: string
): Promise<string> => {
    try {
        const layouts = await import("./layouts");
        const examples =
            layouts.EXAMPLE_DIAGRAMS[
                layoutNumber.toString() as keyof typeof layouts.EXAMPLE_DIAGRAMS
            ];

        const exampleDiagrams =
            examples && Array.isArray(examples)
                ? examples.slice(0, 2).join("\n\n--- EXAMPLE 2 ---\n\n")
                : "";

        const diagramTypes = {
            3: "flowchart",
            4: "mindmap",
            5: "pie",
            6: "quadrantChart",
        };

        const diagramType =
            diagramTypes[layoutNumber as keyof typeof diagramTypes] ||
            "flowchart";

        const prompt = `Generate a valid Mermaid ${diagramType} diagram for the educational concept: "${message}".

Context: ${context}
Diagram Description: ${diagramDescription}

EXAMPLES OF VALID ${diagramType.toUpperCase()} DIAGRAMS:
${exampleDiagrams}

REQUIREMENTS:
- Generate ONLY a valid Mermaid ${diagramType} syntax
- Use educational, clear node names (no generic A, B, C labels)
- Include 4-7 meaningful elements
- For flowcharts: use proper arrows and decision points
- For mindmaps: use nested structure with ((root))
- For pie charts: use meaningful categories with percentages
- For quadrant charts: include axis labels and data points
- Make it educational and relevant to "${message}"
- NO explanatory text, just the diagram code

Return ONLY the Mermaid diagram string, nothing else.`;

        const response = await askAI(prompt);
        console.log("Mermaid diagram response:", response);

        // Clean the response to extract just the diagram
        let cleanedDiagram = response
            .replace(/```mermaid\s*\n?/gi, "")
            .replace(/```\s*$/gi, "")
            .trim();

        // If response contains multiple potential diagrams, take the first one
        const diagramMatch = cleanedDiagram.match(
            /^(flowchart|mindmap|pie|quadrantChart)[\s\S]*?(?=\n\n|$)/
        );
        if (diagramMatch) {
            cleanedDiagram = diagramMatch[0];
        }

        return cleanedDiagram || getDefaultDiagram(layoutNumber, message);
    } catch (error) {
        console.error("Error fetching Mermaid diagram:", error);
        return getDefaultDiagram(layoutNumber, message);
    }
};

/**
 * Get a default diagram if AI generation fails
 */
const getDefaultDiagram = (layoutNumber: number, message: string): string => {
    const defaults = {
        3: `flowchart TD
    A[${message}] --> B[Understanding]
    B --> C[Application]
    C --> D[Mastery]`,
        4: `mindmap
  root((${message}))
    Key Concept 1
    Key Concept 2
    Key Concept 3`,
        5: `pie
    title ${message} Analysis
    "Primary Aspect" : 50
    "Secondary Aspect" : 30
    "Other Aspects" : 20`,
        6: `quadrantChart
    title ${message} Framework
    x-axis Low --> High
    y-axis Simple --> Complex
    quadrant-1 Basic
    quadrant-2 Advanced
    quadrant-3 Elementary
    quadrant-4 Expert`,
    };

    return defaults[layoutNumber as keyof typeof defaults] || defaults[3];
};

export const askAiForContent = async (
    message: string,
    context: string,
    layoutNumber: number,
    _mode: string
): Promise<any[]> => {
    try {
        // For diagram layouts (3-6), split into two requests
        if (layoutNumber >= 3 && layoutNumber <= 6) {
            console.log(
                `Handling diagram layout ${layoutNumber} with split requests`
            );

            // Step 1: Get diagram description and explanation text concurrently
            const [diagramDescription, explanationResponse] = await Promise.all(
                [
                    askAiForDiagramDescription(message, context, layoutNumber),
                    askAI(`Generate a comprehensive educational explanation for "${message}" in the context: ${context}. 
                      Provide 150-200 words of detailed, educational content explaining the concept thoroughly.
                      Write in clear, engaging paragraphs with proper educational structure.
                      Return ONLY the explanation text, no JSON formatting.`),
                ]
            );

            console.log("Diagram description:", diagramDescription);
            console.log("Explanation response:", explanationResponse);

            // Step 2: Generate the actual Mermaid diagram
            const mermaidDiagram = await askAiForMermaidDiagram(
                message,
                context,
                layoutNumber,
                diagramDescription
            );

            console.log("Generated Mermaid diagram:", mermaidDiagram);

            // Return the content in the expected schema format
            return [
                mermaidDiagram,
                explanationResponse || `Educational explanation for ${message}`,
            ];
        }

        // For non-diagram layouts, use original logic
        const layouts = await import("./layouts");
        const schema =
            layouts.LAYOUT_SCHEMA[
                layoutNumber.toString() as keyof typeof layouts.LAYOUT_SCHEMA
            ];

        const schemaString = Array.isArray(schema)
            ? JSON.stringify(schema)
            : schema;

        const response = await askAI(
            contentPrompt(context, message, schemaString, layoutNumber)
        );
        console.log("Content response:", response);
        const cleanedResponse = cleanJsonResponse(response);

        try {
            const parsed = JSON.parse(cleanedResponse);
            return Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
            console.warn("JSON parse failed, attempting repair:", parseError);
            // Try direct jsonrepair as a last resort
            const repairedJson = jsonrepair(response);
            const parsed = JSON.parse(repairedJson);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (error) {
        console.error("Error fetching content:", error);
        return [];
    }
};

/**
 * Enhanced AI service that handles the complete node generation workflow
 * All AI calls are made concurrently for better performance
 */
export const generateNodeContent = async (
    message: string,
    context: string = "",
    mode: string = "default",
    lastTwoLayouts: number[] = [],
    isQuiz = false
): Promise<{
    layout: number;
    content: any[];
    suggestions: string[];
    icon: string;
    title: string;
    fullText: string;
}> => {
    try {
        if (isQuiz) {
            const [content, icon] = await Promise.all([
                askAIForQuizContent(message),
                askAIForIcon(message),
            ]);

            return {
                layout: -1,
                content: [content],
                suggestions: [],
                icon: icon ?? "✨",
                title: message,
                fullText: message,
            };
        }
        // Step 1: Get layout recommendation first (needed for content)
        const layout = await askAiForLayout(message, lastTwoLayouts);
        console.log("Selected layout:", layout);

        // Step 2: Make all remaining calls concurrently
        const [content, suggestions, icon] = await Promise.all([
            askAiForContent(message, context, layout, mode),
            askAiForSuggestions(message),
            askAIForIcon(message),
        ]);

        console.log("Generated content:", content);
        console.log("Generated suggestions:", suggestions);
        console.log("Generated icon:", icon);

        return {
            layout,
            content,
            suggestions,
            icon,
            title: message,
            fullText: message,
        };
    } catch (error) {
        console.error("Error in generateNodeContent:", error);

        // Return fallback values
        return {
            layout: 1,
            content: [message, "Content loading failed", []],
            suggestions: [],
            icon: "✨",
            title: message,
            fullText: message,
        };
    }
};
