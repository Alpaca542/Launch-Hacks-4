/* eslint-disable */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: "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",
});

export const groqChat = onCall(
    {
        cors: true,
        timeoutSeconds: 60,
        memory: "256MiB",
    },
    async (request, response) => {
        try {
            const { message } = request.data;

            if (!message || typeof message !== "string") {
                throw new HttpsError(
                    "invalid-argument",
                    "Message is required and must be a string"
                );
            }

            logger.info("Processing OpenAI chat request", {
                message: message.substring(0, 100),
                acceptsStreaming: request.acceptsStreaming,
                hasResponse: !!response,
            });

            // Check if client supports streaming
            if (request.acceptsStreaming && response) {
                logger.info(
                    "Client supports streaming, starting stream response"
                );
                // Handle streaming response using Responses API
                const streamResponse = await openai.responses.create({
                    model: "gpt-4o",
                    stream: true,
                    instructions: "You are a helpful assistant.",
                    input: [
                        {
                            type: "message",
                            role: "user",
                            content: [{ type: "input_text", text: message }],
                        },
                    ],
                });

                let fullResponse = "";
                let chunkCount = 0;
                for await (const chunk of streamResponse) {
                    if (chunk.type === "response.output_text.delta") {
                        const content = chunk.delta;
                        if (content) {
                            chunkCount++;
                            fullResponse += content;
                            // Send each chunk to streaming clients
                            const chunkData = {
                                type: "chunk",
                                content: content,
                            };
                            logger.info(
                                `Sending chunk ${chunkCount}:`,
                                chunkData
                            );
                            response.sendChunk(chunkData);
                        }
                    }
                }

                logger.info(
                    `Streaming complete. Sent ${chunkCount} chunks. Full response length: ${fullResponse.length}`
                );

                // Return the complete response for non-streaming clients and final result for streaming
                return {
                    response: fullResponse,
                    type: "complete",
                };
            } else {
                // Handle non-streaming response using Responses API
                const chatCompletion = await openai.responses.create({
                    model: "gpt-4o",
                    stream: false,
                    instructions: "You are a helpful assistant.",
                    input: [
                        {
                            type: "message",
                            role: "user",
                            content: [{ type: "input_text", text: message }],
                        },
                    ],
                });

                let responseText = "";
                if (chatCompletion.output && chatCompletion.output.length > 0) {
                    // Extract text content from the response
                    const messageContent = chatCompletion.output.find(
                        (item) => item.type === "message"
                    );
                    if (messageContent && messageContent.type === "message") {
                        // Extract text from the message content
                        const textContent = messageContent.content.find(
                            (content) => content.type === "output_text"
                        );
                        if (textContent && textContent.type === "output_text") {
                            responseText =
                                textContent.text || "No response generated";
                        }
                    }
                } else {
                    responseText = "No response generated";
                }

                return {
                    response: responseText,
                    type: "complete",
                };
            }
        } catch (error) {
            logger.error("Error in openaiChat function:", error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                "internal",
                "An internal error occurred while processing your request"
            );
        }
    }
);
