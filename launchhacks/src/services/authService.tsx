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
        console.log(data);
        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        throw err;
    }
};
