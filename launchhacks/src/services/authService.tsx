import { signOut } from "firebase/auth";
import { auth } from "../firebase";
const FULL_PROMPT =
    "Please explain the provided concept in details. Every key concept needs to be showcased by the notation _concept_ The concept: ";
const SUMMARY_PROMPT =
    "Please summarise the provided text. Your main goal is to mention in the summary all the key concepts showcased by the notation _concept_. In the returned text, you should keep the same notation. The original text: ";

export interface AIResponse {
    message?: string;
    data?: any;
    error?: string;
}

export const handleSignOut = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
};

export const askAI = async (message: string): Promise<AIResponse> => {
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
        return data;
    } catch (err) {
        throw err;
    }
};

export const getFullResponse = async (concept: string) => {
    try {
        const full_response = await askAI(FULL_PROMPT + concept);
        const summary_reponse = await askAI(SUMMARY_PROMPT + concept);
        return {
            full_response,
            summary_reponse,
        };
    } catch (err) {
        throw err;
    }
};
