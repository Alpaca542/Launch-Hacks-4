/**
 * AI Service Module
 *
 * Handles all AI interactions for generating educational content including:
 * - Content suggestions and recommendations
 * - Layout selection and optimization
 * - Icon generation for visual representation
 * - Structured content generation with schema validation
 *
 * Uses Supabase Edge Functions with OpenAI for fast, reliable AI responses.
 */

import supabase, { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabase-client";
import { jsonrepair } from "jsonrepair";
import {
    suggestionsPrompt,
    iconPrompt,
    layoutPrompt,
    contentPrompt,
    quizPrompt,
    diagramContentPrompt,
} from "./prompts";

// AI Model Constants
const SUMMARIZE_MODEL = "gpt-4o-mini";
const ICON_MODEL = "gpt-4o-mini";
const LAYOUT_MODEL = "gpt-4o-mini";
const SUGGESTIONS_MODEL = "gpt-4o-mini";
const CONTENT_MODEL = "gpt-4o";
const QUIZ_MODEL = "gpt-4o-mini";
const DIAGRAM_DESCRIPTION_MODEL = "gpt-4o-mini";
const MERMAID_DIAGRAM_MODEL = "gpt-4o-mini";

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

const askAI = async (message: string, model: string): Promise<any> => {
    try {
        if (!message || typeof message !== "string") {
            throw new Error("Message must be a non-empty string");
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            throw new Error("Message cannot be empty or just whitespace");
        }

        const { data, error } = await supabase.functions.invoke("ai-remote", {
            body: {
                message: trimmedMessage,
                model: model,
            },
        });

        if (error) throw error;
        console.log("AI response:", data);
        return data?.response || "";
    } catch (err) {
        console.error("Supabase function error:", err);
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
                "Creates a detailed knowledge node with AI-generated content about a specific topic. You need to provide a detailed request for the node's contents so that it perfectly matches and accompanies your message. The visuals should be a nice representation of your words.",
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
                            "A detailed description and context for the node's content",
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
    currentBoardTitle: string,
    currentNodeText: string,
    context: string,
    onComplete?: () => void,
    onError?: (error: Error) => void,
    options?: AIStreamOptions
): Promise<void> => {
    try {
        if (!message || typeof message !== "string") {
            throw new Error("Message must be a non-empty string");
        }
        const stream_prompt = `You are an educational assistant with a chill, friendly vibe and a genuine enthusiasm for the subject. Your goal is to provide helpful, engaging explanations that are clear, concise, and easy to follow.

Use visual representations (e.g., diagrams, charts, examples) whenever they can help illustrate a concept.

Keep the tone approachable but ensure the content remains accurate and well-structured.

Show curiosity and interest in the topic, making the explanation feel inviting rather than dry.

Combine plain-text explanations with visual aids to enhance understanding. ALL of your messages should include at least 2 paragraphs of text and AT LEAST 1 visual representation.

You may use several visuals if relevant.

You need to use markdown for the answers.

Context:

Current board: ${currentBoardTitle}

Current node: ${currentNodeText}

Previous dialogue: ${context}

Base your response on the following message:

`;
        const trimmedMessage = stream_prompt + message.trim();
        if (!trimmedMessage) {
            throw new Error("Message cannot be empty or just whitespace");
        }

        const payload: any = {
            message: trimmedMessage,
            acceptsStreaming: true,
        };

        if (options?.enableTools && options?.availableTools) {
            payload.tools = options.availableTools;
            payload.tool_choice = "auto";
        }

        // Use direct fetch to Supabase Edge Function to support true SSE streaming
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-remote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Supabase function error: ${res.status} ${text}`);
        }

        const contentType =
            res.headers.get("content-type")?.toLowerCase() || "";

        // If server returned JSON (non-streaming fallback), handle it
        if (!contentType.includes("text/event-stream")) {
            const data = await res.json().catch(() => ({}));
            if (data?.type === "error") {
                throw new Error(data.message || "Stream error");
            }

            if (data?.response) {
                const text: string = String(data.response);
                onChunk(text);
            }

            if (
                data?.tool_calls &&
                data.tool_calls.length &&
                options?.onToolCall
            ) {
                for (const toolCall of data.tool_calls as ToolCall[]) {
                    try {
                        onChunk(`\n🔧 Using ${toolCall.function.name}...\n`);
                        const toolResult = await options.onToolCall(toolCall);
                        onChunk(`✅ ${toolResult}\n`);
                    } catch (toolError: any) {
                        onChunk(
                            `❌ Tool execution failed: ${
                                toolError?.message || toolError
                            }\n`
                        );
                    }
                }
            }

            onComplete?.();
            return;
        }

        // Stream and parse SSE events
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        const decoder = new TextDecoder();
        let buffer = "";
        let lastCompleteEvent: any | null = null;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
                const rawEvent = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);

                // Each SSE event may contain multiple lines, we care about lines starting with "data:"
                for (const line of rawEvent.split("\n")) {
                    const m = line.match(/^data:\s*(.*)$/);
                    if (!m) continue;
                    const payloadStr = m[1];
                    if (!payloadStr || payloadStr === "[DONE]") continue;

                    try {
                        const evt = JSON.parse(payloadStr);
                        if (evt.type === "chunk" && evt.content) {
                            onChunk(String(evt.content));
                        } else if (evt.type === "error") {
                            throw new Error(evt.message || "Stream error");
                        } else if (evt.type === "complete") {
                            lastCompleteEvent = evt;
                        }
                    } catch {
                        // Non-JSON data line, emit as-is to preserve text
                        onChunk(payloadStr);
                    }
                }
            }
        }

        // Handle any final complete event (tool calls, etc.)
        if (lastCompleteEvent) {
            // Only handle tool calls in complete event if they weren't already handled mid-stream
            if (
                lastCompleteEvent.tool_calls &&
                lastCompleteEvent.tool_calls.length &&
                options?.onToolCall
            ) {
                for (const toolCall of lastCompleteEvent.tool_calls as ToolCall[]) {
                    try {
                        onChunk(`\n🔧 Using ${toolCall.function.name}...\n`);
                        const toolResult = await options.onToolCall(toolCall);
                        onChunk(`✅ ${toolResult}\n`);
                    } catch (toolError: any) {
                        onChunk(
                            `❌ Tool execution failed: ${
                                toolError?.message || toolError
                            }\n`
                        );
                    }
                }
            }

            if (lastCompleteEvent.response) {
                // If the server buffered the full response as well
                // Avoid duplicating content if chunks already emitted; append only if needed
                // Here we append nothing extra to prevent duplicates
            }
        }

        onComplete?.();
    } catch (err: any) {
        console.error("AI Stream error:", err);
        const errorMessage = err?.message || "An unexpected error occurred";
        onChunk(`Sorry, there was an error: ${errorMessage}`);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        onComplete?.();
    }
};

export const askAIForQuizContent = async (message: string): Promise<string> => {
    try {
        const response = await askAI(quizPrompt(message), QUIZ_MODEL);
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
        const response = await askAI(
            suggestionsPrompt(message, "default"),
            SUGGESTIONS_MODEL
        );
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
        const response = await askAI(
            iconPrompt(message, "default"),
            ICON_MODEL
        );
        console.log("Icon response:", response);
        return response || "✨";
    } catch (error) {
        console.error("Error fetching icon:", error);
        return "✨";
    }
};

export const askAIToSummarize = async (message: string): Promise<string> => {
    try {
        const prompt = `Summarize the following text in 2-3 sentences, focusing on the main ideas and keeping it clear and concise. Do not include any extra commentary or formatting.

Text:
${message}

Return ONLY the summary text.`;
        const response = await askAI(prompt, SUMMARIZE_MODEL);
        console.log("Summary response:", response);
        return response || "";
    } catch (error) {
        console.error("Error fetching summary:", error);
        return "";
    }
};

export const askAiForLayout = async (
    message: string,
    lastTwoLayouts: number[] = []
): Promise<number> => {
    try {
        const response = await askAI(
            layoutPrompt(message, "default", lastTwoLayouts),
            LAYOUT_MODEL
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

        const response = await askAI(prompt, DIAGRAM_DESCRIPTION_MODEL);
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
- For mindmaps: use nested structure with (root)
- For pie charts: use meaningful categories with percentages
- For quadrant charts: include axis labels and data points
- Make it educational and relevant to "${message}"
- NO explanatory text, just the diagram code

Return ONLY the Mermaid diagram string, nothing else.`;

        const response = await askAI(prompt, MERMAID_DIAGRAM_MODEL);
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
            // Step 1: Get the diagram description first
            const diagramDescription = await askAiForDiagramDescription(
                message,
                context,
                layoutNumber
            );

            // Step 2: Concurrently generate the diagram and explanation text
            const [mermaidDiagram, explanationResponse] = await Promise.all([
                askAiForMermaidDiagram(
                    message,
                    context,
                    layoutNumber,
                    diagramDescription
                ),
                askAI(
                    diagramContentPrompt(diagramDescription, message, context),
                    CONTENT_MODEL
                ),
            ]);

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
            contentPrompt(context, message, schemaString, layoutNumber),
            CONTENT_MODEL
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
        if (message.length > 300) {
            askAIToSummarize(message)
                .then((summary) => {
                    message = summary;
                    console.log("Summarized message:", message);
                })
                .catch((error) => {
                    console.error("Error summarizing message:", error);
                    // Fallback to original message if summarization fails
                });
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
