import { signOut } from "firebase/auth";
import { auth } from "../firebase";

// Type definitions
export interface AIResponse {
    response?: string;
    data?: any;
    error?: string;
}

export const handleSignOut = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log("User signed out successfully");
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

const askAI = async (message: string): Promise<AIResponse> => {
    try {
        const response = await fetch(
            `https://groqchat-zm2y2mo6eq-uc.a.run.app?message=${encodeURIComponent(
                message
            )}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AIResponse = await response.json();
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
): Promise<{ firstResponse: AIResponse; secondResponse: AIResponse }> => {
    try {
        const constantPromptOrig = `You are an expert educator. Explain the following concept clearly and comprehensively. 

        Context: ${context}

        Instructions:
        - Provide a detailed explanation suitable for learning
        - Mark ALL key concepts with curly-braces tags like {concept} (e.g., {algorithm}, {variable})
        - Use examples where appropriate
        - Structure your response logically
        - CRITICAL: Every important concept MUST be put in currly braces like {concept} (e.g., {algorithm}, {variable})
        - Do not include any meta-commentary, introductions, or conclusions
        - Only provide the educational content requested
        - Start directly with the explanation

        Concept to explain: `;

        const constantPromptSum = `Create a concise summary of the following explanation in exactly 40 words or less.

        CRITICAL REQUIREMENTS:
        - Preserve ALL concepts marked with curly-braces exactly as {concept}
        - EVERY key concept MUST be put in currly braces like {concept} (e.g., {algorithm}, {variable})
        - Do not add any introductory text like "Here is a summary" or "The summary is"
        - Do not add any concluding remarks
        - Start directly with the summary content
        - Use simple language
        - Maintain technical accuracy
        - Do not use bullet points, lists, or any formatting except curly-braces tags
        - Respond ONLY with the summary text

        Text to summarize: `;

        const firstResponse = await askAI(constantPromptOrig + message);

        const secondResponse = await askAI(
            constantPromptSum + firstResponse.response
        );

        return {
            firstResponse: {
                ...firstResponse,
                response: firstResponse.response
                    ?.replace(/\{/g, "_")
                    .replace(/\}/g, "_"),
            },
            secondResponse: {
                ...secondResponse,
                response: secondResponse.response
                    ?.replace(/\{/g, "_")
                    .replace(/\}/g, "_"),
            },
        };
    } catch (error) {
        console.error("Error in askAITwice:", error);
        throw error;
    }
};
