import { useState, useCallback, useRef, useEffect } from "react";

interface LayoutHistoryState {
    lastTwoLayouts: number[];
    addLayout: (layout: number) => void;
    getLastTwoLayouts: () => number[];
    clearHistory: () => void;
}

/**
 * Hook to track the last 2 layouts used by the user
 * This helps the AI choose diverse layouts and avoid repetition
 */
export const useLayoutHistory = (userId?: string): LayoutHistoryState => {
    const [lastTwoLayouts, setLastTwoLayouts] = useState<number[]>([]);
    const userIdRef = useRef<string | undefined>(userId);

    // Load layout history from localStorage when userId changes
    useEffect(() => {
        if (userId && userId !== userIdRef.current) {
            userIdRef.current = userId;
            const savedHistory = localStorage.getItem(
                `layoutHistory_${userId}`
            );
            if (savedHistory) {
                try {
                    const parsed = JSON.parse(savedHistory);
                    if (Array.isArray(parsed) && parsed.length <= 2) {
                        setLastTwoLayouts(parsed);
                    }
                } catch (error) {
                    console.warn(
                        "Failed to parse saved layout history:",
                        error
                    );
                }
            }
        }
    }, [userId]);

    // Save to localStorage whenever history changes
    useEffect(() => {
        if (userId && lastTwoLayouts.length > 0) {
            localStorage.setItem(
                `layoutHistory_${userId}`,
                JSON.stringify(lastTwoLayouts)
            );
        }
    }, [lastTwoLayouts, userId]);

    const addLayout = useCallback((layout: number) => {
        setLastTwoLayouts((prev) => {
            // Don't add if it's the same as the most recent layout
            if (prev.length > 0 && prev[prev.length - 1] === layout) {
                return prev;
            }

            const newHistory = [...prev, layout];
            // Keep only the last 2 layouts
            if (newHistory.length > 2) {
                return newHistory.slice(-2);
            }
            return newHistory;
        });
    }, []);

    const getLastTwoLayouts = useCallback(() => {
        return [...lastTwoLayouts];
    }, [lastTwoLayouts]);

    const clearHistory = useCallback(() => {
        setLastTwoLayouts([]);
        if (userId) {
            localStorage.removeItem(`layoutHistory_${userId}`);
        }
    }, [userId]);

    return {
        lastTwoLayouts,
        addLayout,
        getLastTwoLayouts,
        clearHistory,
    };
};
