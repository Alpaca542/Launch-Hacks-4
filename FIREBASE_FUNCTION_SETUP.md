# Firebase Function Integration for OpenAI Tools

## Overview

To support the new node creation tools, you need to update your Firebase Cloud Function to handle OpenAI function calling. Here's how to modify your existing `groqChat` function.

## Updated Firebase Function Code

```typescript
import * as functions from "firebase-functions";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: functions.config().openai.key, // Set via: firebase functions:config:set openai.key="your-key"
});

export const groqChat = functions.https.onCall(async (data, context) => {
    try {
        const { message, tools, tool_choice } = data;

        if (!message || typeof message !== "string") {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Message must be a non-empty string"
            );
        }

        // Prepare the messages array
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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

        // Prepare the completion parameters
        const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParams =
            {
                model: "gpt-4", // or "gpt-3.5-turbo"
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            };

        // Add tools if provided
        if (tools && Array.isArray(tools)) {
            completionParams.tools = tools;
            if (tool_choice) {
                completionParams.tool_choice = tool_choice;
            }
        }

        // Make the API call to OpenAI
        const completion = await openai.chat.completions.create(
            completionParams
        );

        const choice = completion.choices[0];
        if (!choice) {
            throw new functions.https.HttpsError(
                "internal",
                "No response from OpenAI"
            );
        }

        // Return both the message content and any tool calls
        return {
            response: choice.message?.content || "",
            tool_calls: choice.message?.tool_calls || [],
            finish_reason: choice.finish_reason,
        };
    } catch (error) {
        console.error("Error in groqChat:", error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError(
            "internal",
            "Internal server error occurred"
        );
    }
});
```

## Environment Setup

1. **Install dependencies** in your Firebase functions directory:

```bash
cd functions
npm install openai
```

2. **Set your OpenAI API key**:

```bash
firebase functions:config:set openai.key="your-openai-api-key-here"
```

3. **Deploy the function**:

```bash
firebase deploy --only functions:groqChat
```

## Alternative: Using Groq with Function Calling

If you prefer to use Groq instead of OpenAI, here's an alternative implementation:

```typescript
import * as functions from "firebase-functions";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: functions.config().groq.key,
});

export const groqChat = functions.https.onCall(async (data, context) => {
    try {
        const { message, tools, tool_choice } = data;

        if (!message || typeof message !== "string") {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Message must be a non-empty string"
            );
        }

        // Note: Groq may have different function calling support
        // Check Groq documentation for the latest function calling features
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: tools
                        ? "You are an AI assistant. When users need visual representations, respond with suggestions to create nodes. Format tool calls as [CREATE_NODE:{json}] in your response."
                        : "You are a helpful AI assistant.",
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            model: "llama3-8b-8192", // or another Groq model
            temperature: 0.7,
            max_tokens: 1000,
        });

        return {
            response: completion.choices[0]?.message?.content || "",
            tool_calls: [], // Handle tool extraction from response text
            finish_reason: completion.choices[0]?.finish_reason,
        };
    } catch (error) {
        console.error("Error in groqChat:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Internal server error"
        );
    }
});
```

## Testing the Integration

1. **Test basic chat**: Send a simple message without tools enabled
2. **Test tool calling**: Send a message like "Create a knowledge node about photosynthesis" with tools enabled
3. **Verify node creation**: Check that nodes are created in the React Flow canvas

## Usage Examples

The AI will now respond to requests like:

-   "Create a concept map about machine learning"
-   "I need a flowchart showing the software development process"
-   "Make a knowledge node explaining quantum computing"

The AI will automatically use the appropriate tools to create visual nodes when requested.
