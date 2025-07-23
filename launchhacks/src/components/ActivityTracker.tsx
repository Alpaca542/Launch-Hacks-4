import { useEffect, useRef, useCallback } from "react";

interface ActivityTrackerProps {
    onPeriodicSave: () => Promise<void>;
    saveInterval?: number; // in milliseconds, default 20 seconds
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({
    onPeriodicSave,
    saveInterval = 20000, // 20 seconds
}) => {
    const lastActivityRef = useRef<number>(Date.now());
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPageVisibleRef = useRef<boolean>(!document.hidden);
    const isActiveRef = useRef<boolean>(true);

    // Update activity timestamp
    const updateActivity = useCallback(() => {
        if (!isPageVisibleRef.current) return; // Don't track activity if tab is hidden
        lastActivityRef.current = Date.now();
        isActiveRef.current = true;
    }, []);

    // Check if user is still active and page is visible
    const isUserActiveAndVisible = useCallback(() => {
        if (!isPageVisibleRef.current) return false; // Tab is hidden

        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        return timeSinceLastActivity < 30000; // 30 seconds threshold
    }, []);

    // Periodic save function
    const runPeriodicSave = useCallback(async () => {
        if (isUserActiveAndVisible()) {
            try {
                await onPeriodicSave();
                console.log("Periodic save completed successfully");
            } catch (error) {
                console.error("Periodic save failed:", error);
            }
        } else {
            console.log("User inactive or tab hidden, skipping periodic save");
        }

        // Schedule next save
        saveIntervalRef.current = setTimeout(runPeriodicSave, saveInterval);
    }, [onPeriodicSave, saveInterval, isUserActiveAndVisible]);

    useEffect(() => {
        // Handle page visibility changes
        const handleVisibilityChange = () => {
            const wasVisible = isPageVisibleRef.current;
            isPageVisibleRef.current = !document.hidden;

            if (isPageVisibleRef.current && !wasVisible) {
                // Tab became visible, update activity
                updateActivity();
                console.log("Tab became visible, resuming activity tracking");
            } else if (!isPageVisibleRef.current && wasVisible) {
                console.log("Tab became hidden, pausing activity tracking");
            }
        };

        // Optimized activity listeners - using throttling to reduce calls
        let mouseMoveThrottle: NodeJS.Timeout | null = null;
        const handleMouseMove = () => {
            if (!mouseMoveThrottle) {
                mouseMoveThrottle = setTimeout(() => {
                    updateActivity();
                    mouseMoveThrottle = null;
                }, 1000); // Throttle to once per second
            }
        };

        const handleKeyPress = () => {
            updateActivity();
        };

        const handleClick = () => {
            updateActivity();
        };

        // Add event listeners only if page is visible
        const addEventListeners = () => {
            document.addEventListener("mousemove", handleMouseMove, {
                passive: true,
            });
            document.addEventListener("keydown", handleKeyPress, {
                passive: true,
            });
            document.addEventListener("click", handleClick, { passive: true });
        };

        const removeEventListeners = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("keydown", handleKeyPress);
            document.removeEventListener("click", handleClick);
            if (mouseMoveThrottle) {
                clearTimeout(mouseMoveThrottle);
                mouseMoveThrottle = null;
            }
        };

        // Add visibility change listener
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Add event listeners if page is initially visible
        if (isPageVisibleRef.current) {
            addEventListeners();
        }

        // Start the periodic save timer
        saveIntervalRef.current = setTimeout(runPeriodicSave, saveInterval);

        // Cleanup
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            removeEventListeners();

            if (saveIntervalRef.current) {
                clearTimeout(saveIntervalRef.current);
            }
        };
    }, [onPeriodicSave, saveInterval, updateActivity, runPeriodicSave]);

    // This component doesn't render anything, it just tracks activity
    return null;
};
