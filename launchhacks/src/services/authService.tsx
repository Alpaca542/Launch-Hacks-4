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
        const constantPromptOrig = `You are an expert educator and technical writer. Your task is to teach the following concept to a beginner, using clear, concise, and engaging explanations.

        Context: ${context}

        Instructions:
        - Highlight EVERY important concept or term using [square-braces], e.g., [algorithm], [variable].
        - Use simple language and break down complex ideas.
        - Provide at least one practical example or analogy.
        - Emphasize key points using markdown formatting (bold, italics, headings, lists, tables, etc.).
        - Organize the explanation with headings, lists, and tables where appropriate.
        - Use ONLY CORRECT MARKDOWN AND HTML formatting for all content (including tables, lists, images, and code blocks).
        - You NEED TO embed relevant IMAGES or GIFS from the web using embeded HTML IMGS.
        - You MAY embed relevant youtube videos from the web using embeded HTML.
        - Do NOT include introductions, conclusions, or meta-commentary.
        - Start immediately with the explanation content.
        - Do NOT include any text outside the explanation.

        Concept to explain: `;

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
        // Remove leading/trailing ```json or ``` from thirdResponse.response before parsing
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

        return {
            firstResponse: {
                response: firstResponse.response
                    ?.replace(/\[/g, "_")
                    .replace(/\]/g, "_")
                    .replace(/```/g, "")
                    .replace(/```/g, "")
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
    } catch (error) {
        console.error("Error in askAITwice:", error);
        throw error;
    }
};
