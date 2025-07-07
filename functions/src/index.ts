/* eslint-disable */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: "",
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

            logger.info("Processing groq chat request", {
                message: message.substring(0, 100),
                acceptsStreaming: request.acceptsStreaming,
                hasResponse: !!response,
            });

            // Check if client supports streaming
            if (request.acceptsStreaming && response) {
                logger.info(
                    "Client supports streaming, starting stream response"
                );
                // Handle streaming response
                const streamResponse = await groq.chat.completions.create({
                    messages: [{ role: "user", content: message }],
                    model: "llama3-8b-8192",
                    stream: true,
                });

                let fullResponse = "";
                let chunkCount = 0;
                for await (const chunk of streamResponse) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        chunkCount++;
                        fullResponse += content;
                        // Send each chunk to streaming clients
                        const chunkData = {
                            type: "chunk",
                            content: content,
                        };
                        logger.info(`Sending chunk ${chunkCount}:`, chunkData);
                        response.sendChunk(chunkData);
                    }
                }

                logger.info(
                    `Streaming complete. Sent ${chunkCount} chunks. Full response length: ${fullResponse.length}`
                );

                // Process final response
                let processedResponse = fullResponse;
                if (processedResponse.includes(":")) {
                    processedResponse = processedResponse
                        .substring(processedResponse.indexOf(":") + 1)
                        .trim();
                }

                // Return the complete response for non-streaming clients and final result for streaming
                return {
                    response: processedResponse,
                    type: "complete",
                };
            } else {
                // Handle non-streaming response
                const chatCompletion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: message }],
                    model: "llama3-8b-8192",
                    stream: false,
                });

                let responseText =
                    chatCompletion.choices[0]?.message?.content ||
                    "No response generated";

                if (responseText.includes(":")) {
                    responseText = responseText
                        .substring(responseText.indexOf(":") + 1)
                        .trim();
                }

                return {
                    response: responseText,
                    type: "complete",
                };
            }
        } catch (error) {
            logger.error("Error in groqChat function:", error);

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
