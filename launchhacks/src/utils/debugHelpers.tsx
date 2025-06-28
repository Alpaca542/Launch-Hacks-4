// Debug utilities for troubleshooting
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "../firebase";

// Type definitions
export interface ConnectionTestResult {
    success: boolean;
    message: string;
    error?: any;
}

export const testFirestoreConnection = async (
    user: User
): Promise<ConnectionTestResult> => {
    try {
        console.log("Testing Firestore connection...");
        console.log("User:", user);

        // Test basic read access
        const testCollection = collection(db, "boards");
        console.log("Collection reference created:", testCollection);

        // Test write access with a simple document
        const testDoc = {
            test: true,
            userId: user.uid,
            timestamp: new Date(),
        };

        const testDocRef = doc(db, "boards", `test_${Date.now()}`);
        await setDoc(testDocRef, testDoc);
        console.log("Test document written successfully");

        // Test read access
        const snapshot = await getDocs(testCollection);
        console.log("Documents in collection:", snapshot.size);

        return { success: true, message: "Firestore connection working" };
    } catch (error: any) {
        console.error("Firestore connection test failed:", error);
        return {
            success: false,
            message: `Firestore error: ${error.code} - ${error.message}`,
            error,
        };
    }
};

export const logUserPermissions = (user: User | null): void => {
    console.log("=== USER DEBUG INFO ===");
    console.log("User ID:", user?.uid);
    console.log("Email:", user?.email);
    console.log("Email verified:", user?.emailVerified);
    console.log("Provider data:", user?.providerData);
    console.log("========================");
};
