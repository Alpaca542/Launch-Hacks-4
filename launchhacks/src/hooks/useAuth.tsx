import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "../supabase-client";

// Type definitions
export interface UseAuthReturn {
    user: User | null;
    signOut: () => Promise<void>;
}

const handleSignOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        let isMounted = true;
        supabase.auth.getUser().then(({ data }) => {
            if (!isMounted) return;
            setUser(data.user ?? null);
        });
        const { data: sub } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );
        return () => {
            isMounted = false;
            sub.subscription.unsubscribe();
        };
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
