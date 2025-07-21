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

export const askAiForLayout = async (message: string): Promise<number> => {
    try {
        const response = await askAI(layoutPrompt(message, "default"));
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

export const askAiForContent = async (
    message: string,
    context: string,
    layoutNumber: number,
    mode: string
): Promise<any[]> => {
    try {
        // Import layouts directly instead of using dynamic import
        const layouts = await import("./layouts");
        const schema =
            layouts.LAYOUT_SCHEMA[
                layoutNumber.toString() as keyof typeof layouts.LAYOUT_SCHEMA
            ];

        const schemaString = Array.isArray(schema)
            ? JSON.stringify(schema)
            : schema;
        const response = await askAI(
            contentPrompt(context, message, mode, schemaString)
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
    mode: string = "default"
): Promise<{
    layout: number;
    content: any[];
    suggestions: string[];
    icon: string;
    title: string;
    fullText: string;
}> => {
    try {
        // Step 1: Get layout recommendation first (needed for content)
        const layout = await askAiForLayout(message);
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
            fullText: message, // The content IS the educational part, not separate text
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
