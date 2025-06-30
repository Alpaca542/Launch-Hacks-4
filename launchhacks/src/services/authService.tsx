import { signOut } from "firebase/auth";
import { auth } from "../firebase";

// Type definitions
export interface AIResponse {
    message?: string;
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
    message: string
): Promise<{ firstResponse: AIResponse; secondResponse: AIResponse }> => {
    try {
        const constantPromptOrig =
            "Please explain the following text in detail, using the same format and structure as the original text. Key concept in the explanation should be marked as _concept_: ";
        const constantPromptSum =
            "Here is a long explanation. Please summarize it in such a way that key concepts(marked as_concept_) are used and highlighted in the exact same way as they are in the original text. Do not change the meaning of the text, just summarize it: ";
        const firstPrompt = constantPromptOrig + message;

        const firstResponse = await askAI(firstPrompt);

        const secondPrompt = constantPromptSum + firstResponse.message!;
        const secondResponse = await askAI(secondPrompt);

        return {
            firstResponse,
            secondResponse,
        };
    } catch (error) {
        console.error("Error in askAITwice:", error);
        throw error;
    }
};
