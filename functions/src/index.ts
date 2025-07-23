/* eslint-disable */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import OpenAI from "openai";

const openai = new OpenAI({});

export const groqChat = onCall(
    {
        cors: true,
        timeoutSeconds: 60,
        memory: "256MiB",
    },
    async (request, response) => {
        try {
            const { message, tools, tool_choice } = request.data;

            if (!message || typeof message !== "string") {
                throw new HttpsError(
                    "invalid-argument",
                    "Message is required and must be a string"
                );
            }

            logger.info("Processing OpenAI chat request", {
                message: message.substring(0, 100),
                hasTools: !!tools,
                toolChoice: tool_choice,
                acceptsStreaming: request.acceptsStreaming,
                hasResponse: !!response,
            });

            // Prepare messages for OpenAI
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
                [
                    {
                        role: "system",
                        content: tools
                            ? "You are an AI assistant with access to node creation tools. When users ask about creating visual representations, explanations, or learning materials, use the appropriate tools to create nodes. Be helpful and suggest creating visual aids when they would enhance understanding."
                            : "You are a helpful AI assistant.",
                    },
                    {
                        role: "user",
                        content: message,
                    },
                ];

            // Check if client supports streaming
            if (request.acceptsStreaming && response) {
                logger.info(
                    "Client supports streaming, starting stream response"
                );

                // Prepare streaming completion parameters
                const streamingParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming =
                    {
                        model: "gpt-4",
                        messages: messages,
                        max_tokens: 1000,
                        temperature: 0.7,
                        stream: true,
                    };

                // Add tools if provided
                if (tools && Array.isArray(tools)) {
                    streamingParams.tools = tools;
                    if (tool_choice) {
                        streamingParams.tool_choice = tool_choice;
                    }
                }

                const stream = await openai.chat.completions.create(
                    streamingParams
                );

                let fullResponse = "";
                let toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] =
                    [];
                let chunkCount = 0;

                for await (const chunk of stream) {
                    const choice = chunk.choices[0];
                    if (choice?.delta?.content) {
                        chunkCount++;
                        const content = choice.delta.content;
                        fullResponse += content;

                        // Send each chunk to streaming clients
                        const chunkData = {
                            type: "chunk",
                            content: content,
                        };
                        logger.info(`Sending chunk ${chunkCount}:`, chunkData);
                        response.sendChunk(chunkData);
                    }

                    // Handle tool calls in streaming
                    if (choice?.delta?.tool_calls) {
                        for (const toolCallDelta of choice.delta.tool_calls) {
                            if (toolCallDelta.index !== undefined) {
                                if (!toolCalls[toolCallDelta.index]) {
                                    toolCalls[toolCallDelta.index] = {
                                        id: toolCallDelta.id || "",
                                        type: "function",
                                        function: {
                                            name:
                                                toolCallDelta.function?.name ||
                                                "",
                                            arguments:
                                                toolCallDelta.function
                                                    ?.arguments || "",
                                        },
                                    };
                                } else {
                                    // Append to existing tool call
                                    if (toolCallDelta.function?.arguments) {
                                        toolCalls[
                                            toolCallDelta.index
                                        ].function.arguments +=
                                            toolCallDelta.function.arguments;
                                    }
                                }
                            }
                        }
                    }
                }

                logger.info(
                    `Streaming complete. Sent ${chunkCount} chunks. Full response length: ${fullResponse.length}. Tool calls: ${toolCalls.length}`
                );

                // Return the complete response for non-streaming clients and final result for streaming
                return {
                    response: fullResponse,
                    tool_calls: toolCalls,
                    type: "complete",
                };
            } else {
                logger.info("Using non-streaming response");

                // Prepare non-streaming completion parameters
                const nonStreamingParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
                    {
                        model: "gpt-4",
                        messages: messages,
                        max_tokens: 1000,
                        temperature: 0.7,
                        stream: false,
                    };

                // Add tools if provided
                if (tools && Array.isArray(tools)) {
                    nonStreamingParams.tools = tools;
                    if (tool_choice) {
                        nonStreamingParams.tool_choice = tool_choice;
                    }
                }

                // Handle non-streaming response
                const chatCompletion = await openai.chat.completions.create(
                    nonStreamingParams
                );

                const choice = chatCompletion.choices[0];
                if (!choice) {
                    throw new HttpsError("internal", "No response from OpenAI");
                }

                return {
                    response: choice.message?.content || "",
                    tool_calls: choice.message?.tool_calls || [],
                    finish_reason: choice.finish_reason,
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
