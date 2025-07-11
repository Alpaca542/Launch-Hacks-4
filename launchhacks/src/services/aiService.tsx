import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // Adjust path to your Firebase config
import { parseJsonToHtml } from "./htmlParser";
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
        const SCHEMA = [
            {
                large_header: "Large Header Text",
            },
            {
                small_header: "Small Header Text",
            },
            {
                ul: ["Item one", "Item 2", "Item 3"],
            },
            {
                quiz: [
                    {
                        question: "What is the capital of France?",
                        answers: [
                            {
                                Berlin: "It's germany!",
                            },
                            {
                                Madrid: "It is spain :(",
                            },
                            {
                                Paris: "Correct! It's Paris!",
                            },
                        ],
                        correctAnswer: 2,
                    },
                    {
                        question: "What is the capital of Poland?",
                        answers: [
                            {
                                Berlin: "It's germany!",
                            },
                            {
                                Warshava: "Yahoo! It's Poland!",
                            },
                            {
                                Paris: "No!",
                            },
                        ],
                        correctAnswer: 1,
                    },
                ],
            },
            {
                img: [
                    "very short image description(e.g. funny cats)",
                    "The image shows a group of cats doing something amusing.",
                ],
            },
            {
                vid: [
                    "very short video description(e.g. playing footbal)",
                    "This video shows a group of people playing football in a park.",
                ],
            },
            {
                gif: [
                    "very short gif description(e.g. frogs jumping)",
                    "This gif shows frogs jumping around in a pond.",
                ],
            },
            {
                textblock: "text, **text**, (text)[text.com]",
            },
            {
                ol: ["Heyyo", "Nice", "That's a list"],
            },
            {
                codeblock: "console.log('Hello World');",
            },
            {
                quote: "This is a quote",
            },
            {
                link: "https://example.com",
            },
            {
                table: [
                    ["Header1", "Header2"],
                    ["Row1Col1", "Row1Col2"],
                    ["Row2Col1", "Row2Col2"],
                ],
            },
            {
                diagram:
                    "a mermaid-based diagram: graph TD; A-->B; A-->C; B-->D; C-->D;",
            },
            {
                note: "This is a note.",
            },
            {
                warning: "This is a warning note.",
            },
            {
                tip: "This is a tip note.",
            },
            {
                htmlCanvas: "js code for HTML canvas",
            },
        ];

        const detailedExplanationPrompt = `
        Return ONLY a valid JSON array.

        RULES
        • Each object = exactly one tag from SCHEMA; no new tags.
        • Include:
        – Only one of {quiz} with multiple questions
        – At least one of {codeblock or diagram or htmlCanvas or table}
        – At least two of of {img or vid or gif}
        - At least five of of {textblock or ul or ol }
        - ONLY ONE of { tip or note or warning or quote or link}
        • You should educate the user about the concept and then ask the quiz about the material you taught.
        • Use different tags to make the studying experience diverse and engaging
        • Cover, somewhere in the set: definition, deep explanation, worked example, real-world analogy and links at what to look up next.
        • If you have a long explanation, break it into multiple textblocks.
        • Only include tags that genuinely help explain the concept. Don't add tags unnecessarily or just to fill space.
        • Tone: encouraging, professional
        • Make the text of the explanations long and detailed! You need to educate the user
        • You need to have textblocks or lists separating each visual tag, e.g. img, vid, gif, codeblock, diagram, htmlCanvas, table.
        • Make sure to put the concept over the context, not focusing on the context but rather on what actually needs to be explained.

        OUTPUT
        VALID JSON array only — no comments, or extra text. All the braces must be properly closed.

        SCHEMA = ${JSON.stringify(SCHEMA)}\n
        CONTEXT = ${context}
        CONCEPT = ${message}
        `;
        const summaryPrompt = `Provide a brief explanation in 50 words or less.

        CRITICAL:
        - Highlight EVERY key term with [square-braces], e.g., [artificial intelligence], [mammal], [vector product]
        - NO introductory phrases like "Here is..." or "Summary..."
        - NO bullet points or formatting except [square-braces]
        - Start immediately with explanation content
        - ONLY the explanation text

        Topic to explain: `;

        const suggestionsPrompt = `You are an expert educator. Respond ONLY with a valid JSON array in the following format: ["concept1", "concept2", "concept3"]. 

        Instructions:
        - Suggest exactly 3-5 topics that are logical next steps for learning the given concept.
        - Each topic must be no more than 5 words.
        - Each topic MUST be enclosed in double quotes, e.g., "example topic".
        - Do NOT include any explanation, commentary, or formatting outside the JSON array.
        - Only output the JSON array as specified.

        Concept: `;

        // Start all three requests concurrently
        const detailedPromise = askAI(detailedExplanationPrompt);
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

        const processedResult = {
            firstResponse: {
                response: await parseJsonToHtml(
                    JSON.parse(
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
