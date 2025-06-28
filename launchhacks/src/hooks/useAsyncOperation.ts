import { useState, useCallback } from "react";

interface UseAsyncOperationReturn {
    isLoading: boolean;
    error: string | null;
    execute: <T>(asyncOperation: () => Promise<T>) => Promise<T>;
    clearError: () => void;
}

export const useAsyncOperation = (): UseAsyncOperationReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(
        async <T>(asyncOperation: () => Promise<T>): Promise<T> => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await asyncOperation();
                return result;
            } catch (err: any) {
                setError(err.message || "An error occurred");
                console.error("Async operation failed:", err);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading,
        error,
        execute,
        clearError,
    };
};
