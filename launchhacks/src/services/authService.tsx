import { GoogleGenAI } from "@google/genai";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export const handleSignOut = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log("User signed out successfully");
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

const askAI = async (message: string): Promise<any> => {
    try {
        const response = await fetch(
            `https://groqchat-zm2y2mo6eq-uc.a.run.app?message=${encodeURIComponent(
                message
            )}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: any = await response.json();
        console.log(data);
        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        throw err;
    }
};

export const askAITwice = async (
    message: string,
    context: string
): Promise<{
    firstResponse: any;
    secondResponse: any;
    thirdResponse: any;
}> => {
    try {
        const constantPromptOrig = `You are an expert educator. Explain the following concept to a beginner.

        Context: ${context}

        Instructions:
        - Highlight every key term with [square-braces], e.g., [variable].
        - Use simple language and practical examples or analogies.
        - Use only correct HTML for all formatting (headings, lists, tables, images, code).
        - All HTML elements (including headings, lists, tables, images, code) MUST use inline CSS for styling.
        - For inline CSS, use: <span style="color:#fff;background:#222;padding:4px;border-radius:4px;">example</span>
        - For images: <img src="IMAGE_URL" alt="desc" style="max-width:100%;border-radius:8px;">
        - For code: <pre style="background:#222;color:#fff;padding:8px;border-radius:6px;"><code>console.log("Hello World");</code></pre>
        - For tables: <table style="border-collapse:collapse;width:100%;"><tr><th style="background:#222;color:#fff;padding:6px;">Header</th></tr><tr><td style="padding:6px;">Data</td></tr></table>
        - For lists: <ul style="padding-left:20px;"><li style="margin-bottom:4px;">Item 1</li></ul>
        - No introductions, conclusions, or extra commentary.
        - Start directly with the explanation.

        Concept: `;

        const constantPromptSum = `Summarize in exactly 40 words or less.

        CRITICAL:
        - Preserve ALL [square-braces] concepts exactly
        - Every key concept MUST use [square-braces]
        - NO introductory phrases like "Here is..." or "Summary..."
        - NO bullet points or formatting except [square-braces]
        - Start immediately with summary content
        - ONLY the summary text

        Text to summarize: `;
        const constantPromptSuggestions = `You are an expert educator. You answer only in json: {[concept1], [concept2]...}. Suggest 3 topics(each not more than 5 words, each topic is encased in [square-braces]) that are a good next step at learning the following concept:`;
        const firstResponse = await askAI(constantPromptOrig + message);

        const secondResponse = await askAI(
            constantPromptSum + firstResponse.response
        );
        const thirdResponse = await askAI(
            constantPromptSuggestions + secondResponse.response
        );
        // Remove leading/trailing ```json or ``` from thirdResponse.response before parsing, but do NOT delete any newlines
        let cleanedThirdResponse = thirdResponse.response ?? "";
        cleanedThirdResponse = cleanedThirdResponse
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "");

        let topicsArray: string[] = [];
        try {
            // Try to parse as JSON first
            let parsedThirdResponse = JSON.parse(cleanedThirdResponse);
            topicsArray = Array.isArray(parsedThirdResponse.topics)
                ? parsedThirdResponse.topics
                : Object.values(parsedThirdResponse);
        } catch (e) {
            // If not valid JSON, extract all quoted strings
            const matches = cleanedThirdResponse.match(/"(.*?)"/g);
            if (matches) {
                topicsArray = matches.map((str: string) =>
                    str.replace(/"/g, "")
                );
            }
        }

        const newobj = {
            firstResponse: {
                response: firstResponse.response
                    ?.replace(/\[/g, "_")
                    .replace(/\]/g, "_")
                    .replace(/```/g, "") // This only removes the backticks, not newlines
                    .replace(/markdown/g, ""),
            },
            secondResponse: {
                response: secondResponse.response
                    ?.replace(/\[/g, "_")
                    .replace(/\]/g, "_"),
            },
            thirdResponse: {
                response: topicsArray,
            },
        };
        console.log("askAITwice response:", newobj);
        return newobj;
    } catch (error) {
        console.error("Error in askAITwice:", error);
        throw error;
    }
};
