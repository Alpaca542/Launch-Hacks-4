import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

// Type definitions
export interface UseAuthReturn {
    user: User | null;
    signOut: () => Promise<void>;
}

const handleSignOut = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log("User signed out successfully");
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            setUser(user);
            if (user) {
                console.log("User signed in:", user.uid);
            } else {
                console.log("No user signed in");
            }
        });

        return () => unsubscribe();
    }, []);

    const signOut = async (): Promise<void> => {
        try {
            await handleSignOut();
            setUser(null);
        } catch (error) {
            console.error("Error in sign out:", error);
        }
    };

    return {
        user,
        signOut,
    };
};
