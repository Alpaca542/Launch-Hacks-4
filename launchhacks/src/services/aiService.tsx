import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // Adjust path to your Firebase config

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
    onSummaryChunk: (chunk: string) => void
): Promise<{
    firstResponse: any;
    secondResponse: any;
    thirdResponse: any;
}> => {
    try {
        const detailedExplanationPrompt = `You are an expert educator. Explain the following concept to a beginner.

        Context: ${context}

        Instructions:
        - Highlight every key term with [square-braces], e.g., [variable].
        - Use simple language and practical examples or analogies.
        - Use only correct HTML or MARKDOWN for all formatting (headings, lists, tables, images, code).
        - All HTML elements (including headings, lists, tables, images, code) MUST use inline CSS for styling.
        - For inline CSS, use: <span style="color:#fff;background:#222;padding:4px;border-radius:4px;">example</span>
        - For images: <img src="IMAGE_URL" alt="desc" style="max-width:100%;border-radius:8px;">
        - For code: <pre style="background:#222;color:#fff;padding:8px;border-radius:6px;"><code>console.log("Hello World");</code></pre>
        - For tables: <table style="border-collapse:collapse;width:100%;"><tr><th style="background:#222;color:#fff;padding:6px;">Header</th></tr><tr><td style="padding:6px;">Data</td></tr></table>
        - For lists: <ul style="padding-left:20px;"><li style="margin-bottom:4px;">Item 1</li></ul>
        - No introductions, conclusions, or extra commentary.
        - Start directly with the explanation.

        Concept: `;

        const summaryPrompt = `Summarize in exactly 40 words or less.

        CRITICAL:
        - Preserve ALL [square-braces] concepts exactly
        - Every key concept MUST use [square-braces]
        - NO introductory phrases like "Here is..." or "Summary..."
        - NO bullet points or formatting except [square-braces]
        - Start immediately with summary content
        - ONLY the summary text

        Text to summarize: `;

        const suggestionsPrompt = `You are an expert educator. Respond ONLY with a valid JSON object in the following format: {"topics": ["[concept1]", "[concept2]", "[concept3]"]}. 

        Instructions:
        - Suggest exactly 3 topics that are logical next steps for learning the given concept.
        - Each topic must be no more than 5 words.
        - Each topic MUST be enclosed in double quotes, e.g., "example topic".
        - Do NOT include any explanation, commentary, or formatting outside the JSON object.
        - Only output the JSON object as specified.

        Concept: `;

        // Start all three requests concurrently
        const detailedPromise = askAI(detailedExplanationPrompt + message);
        const suggestionsPromise = askAI(suggestionsPrompt + message);

        // Stream the summary with progressive updates
        let summaryAccumulator = "";
        const summaryPromise = askAIStream(
            summaryPrompt + message,
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
            .replace(/```$/i, "");

        let parsedTopics: string[] = [];

        const quotedStringMatches = cleanedSuggestionsData.match(/"(.*?)"/g);
        if (quotedStringMatches) {
            parsedTopics = quotedStringMatches.map((str: string) =>
                str.replace(/"/g, "")
            );
        }

        const processedResult = {
            firstResponse: {
                response: detailedExplanation
                    ?.replace(/\[/g, "_")
                    .replace(/\]/g, "_")
                    .replace(/```/g, "")
                    .replace(/markdown/g, ""),
            },
            secondResponse: {
                response: summaryResponse // This is the complete streamed response
                    ?.replace(/\[/g, "_")
                    .replace(/\]/g, "_")
                    .replace(
                        /Here is a summary of the text in exactly 40 words or less:/g,
                        ""
                    )
                    .replace(
                        "/Here is a summary of the text in 40 words or less:/g",
                        ""
                    ),
            },
            thirdResponse: {
                response: parsedTopics,
            },
        };

        console.log("askAITwice response:", processedResult);
        return processedResult;
    } catch (error) {
        console.error("Error in askAITwice:", error);
        throw error;
    }
};
