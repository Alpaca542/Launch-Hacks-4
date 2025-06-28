import { useMemo, useCallback, useState, useEffect } from "react";

export const useOptimizedCallbacks = (dependencies: Record<string, any>) => {
    return useMemo(() => {
        const callbacks: Record<string, any> = {};

        Object.entries(dependencies).forEach(([key, value]) => {
            if (typeof value === "function") {
                callbacks[key] = useCallback(value, [value]);
            } else {
                callbacks[key] = value;
            }
        });

        return callbacks;
    }, [dependencies]);
};

export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export const useMemoizedValue = <T>(
    computeValue: () => T,
    dependencies: React.DependencyList
): T => {
    return useMemo(computeValue, dependencies);
};
