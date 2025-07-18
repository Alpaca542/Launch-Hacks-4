import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // Adjust path to your Firebase config
import { parseJsonToHtml } from "./htmlParser";
import { jsonrepair } from "jsonrepair";
import {
    detailedExplanationPrompt,
    suggestionsPrompt,
    summaryPrompt,
} from "./prompts";

import { SCHEMA } from "./prompts";
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

const askAIStream = async (
    message: string,
    onChunk?: (chunk: string) => void
): Promise<string> => {
    try {
        // Add validation
        if (!message || typeof message !== "string") {
            throw new Error("Message must be a non-empty string");
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            throw new Error("Message cannot be empty or just whitespace");
        }

        const groqChatFunction = httpsCallable(functions, "groqChat");

        console.log("Starting streaming request...");
        // Use Firebase callable function streaming - following the official pattern
        const { stream, data } = await groqChatFunction.stream({
            message: trimmedMessage,
        });

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
                const typedChunk = chunk as { type: string; content: string };
                console.log("Processing chunk:", typedChunk);
                if (typedChunk.type === "chunk" && typedChunk.content) {
                    fullResponse += typedChunk.content;
                    onChunk?.(typedChunk.content);
                }
            }
        }

        // The `data` promise resolves when the callable function completes
        console.log("Waiting for final result...");
        const finalResult = await data;
        console.log("Final result received:", finalResult);

        // Return the response from the final result or the accumulated response
        if (
            finalResult &&
            typeof finalResult === "object" &&
            "response" in finalResult
        ) {
            console.log("Returning final result response");
            return finalResult.response as string;
        }

        console.log("Returning accumulated response:", fullResponse);
        return fullResponse;
    } catch (err) {
        console.error("Firebase function streaming error:", err);
        throw err;
    }
};

export const askAITwice = async (
    message: string,
    context: string,
    inputMode: string,
    onSummaryChunk: (chunk: string) => void
): Promise<{
    firstResponse: any;
    secondResponse: any;
    thirdResponse: any;
}> => {
    try {
        // Start all three requests concurrently
        const detailedPromise = askAI(
            detailedExplanationPrompt(
                context ?? "",
                message ?? "",
                SCHEMA ?? [],
                inputMode ?? ""
            )
        );
        const suggestionsPromise = askAI(suggestionsPrompt(message, inputMode));

        // Stream the summary with progressive updates
        let summaryAccumulator = "";
        const summaryPromise = askAIStream(
            summaryPrompt(message, context, inputMode),
            (chunk: string) => {
                summaryAccumulator += chunk;
                // Call the callback with each chunk for progressive updates
                onSummaryChunk(chunk);
            }
        );

        // Wait for all responses to complete
        const [detailedExplanation, suggestionsData, summaryResponse] =
            await Promise.all([
                detailedPromise,
                suggestionsPromise,
                summaryPromise,
            ]);

        let cleanedSuggestionsData = suggestionsData ?? "";
        cleanedSuggestionsData = cleanedSuggestionsData
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .replace(/\\/g, "&#92;")
            .replace(/\$/g, "&#36;")
            .replace(/\^/g, "&#94;")
            .replace(/_/g, "&#95;")
            .replace(/~/g, "&#126;")
            .replace(/&/g, "&#38;");

        let parsedTopics: string[] = [];

        const quotedStringMatches = cleanedSuggestionsData.match(/"(.*?)"/g);
        if (quotedStringMatches) {
            parsedTopics = quotedStringMatches.map((str: string) =>
                str.replace(/"/g, "")
            );
        }

        // Helper to safely parse JSON, repairing if needed
        const safeParseJson = (jsonStr: string) => {
            try {
                return JSON.parse(jsonStr);
            } catch {
                try {
                    const repaired = jsonrepair(jsonStr);
                    return JSON.parse(repaired);
                } catch (err) {
                    console.error("JSON parsing and repair failed:", err);
                    throw err;
                }
            }
        };

        const processedResult = {
            firstResponse: {
                response: await parseJsonToHtml(
                    safeParseJson(
                        detailedExplanation
                            .replace(/^```json\s*/i, "")
                            .replace(/^```\s*/i, "")
                            .replace(/```$/i, "")
                    )
                ),
            },
            secondResponse: {
                response: summaryResponse // This is the complete streamed response
                    ?.replace(/\[/g, "_")
                    .replace(/\]/g, "_"),
            },
            thirdResponse: {
                response: (() => {
                    try {
                        return safeParseJson(cleanedSuggestionsData);
                    } catch {
                        return parsedTopics;
                    }
                })(),
            },
        };

        console.log("askAITwice response:", processedResult);
        return processedResult;
    } catch (error) {
        console.error("Error in askAITwice:", error);
        throw error;
    }
};
