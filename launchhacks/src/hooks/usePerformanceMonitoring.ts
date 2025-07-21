/**
 * Performance monitoring hook
 * Tracks various metrics to help identify performance bottlenecks
 */

import { useState, useEffect, useRef } from "react";

interface PerformanceMetrics {
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
    maxRenderTime: number;
    dbRequestCount: number;
    lastDbRequestTime: number;
    totalDbRequestTime: number;
    memoryUsage?: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        renderCount: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        dbRequestCount: 0,
        lastDbRequestTime: 0,
        totalDbRequestTime: 0,
    });

    const renderStartTime = useRef<number>(0);
    const renderTimes = useRef<number[]>([]);
    const dbStartTimes = useRef<Map<string, number>>(new Map());

    // Track render performance
    useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - renderStartTime.current;

        if (renderStartTime.current > 0) {
            renderTimes.current.push(renderTime);

            // Keep only last 50 render times to prevent memory buildup
            if (renderTimes.current.length > 50) {
                renderTimes.current = renderTimes.current.slice(-50);
            }

            const avgTime =
                renderTimes.current.reduce((a, b) => a + b, 0) /
                renderTimes.current.length;
            const maxTime = Math.max(...renderTimes.current);

            setMetrics((prev) => ({
                ...prev,
                renderCount: prev.renderCount + 1,
                lastRenderTime: renderTime,
                averageRenderTime: avgTime,
                maxRenderTime: maxTime,
            }));
        }

        renderStartTime.current = performance.now();
    });

    // Track memory usage
    useEffect(() => {
        const updateMemoryUsage = () => {
            if ("memory" in performance) {
                const memInfo = (performance as any).memory;
                setMetrics((prev) => ({
                    ...prev,
                    memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024, // Convert to MB
                }));
            }
        };

        updateMemoryUsage();
        const interval = setInterval(updateMemoryUsage, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    // Function to start tracking a database request
    const startDbRequest = (requestId: string) => {
        dbStartTimes.current.set(requestId, performance.now());
    };

    // Function to end tracking a database request
    const endDbRequest = (requestId: string) => {
        const startTime = dbStartTimes.current.get(requestId);
        if (startTime) {
            const requestTime = performance.now() - startTime;
            dbStartTimes.current.delete(requestId);

            setMetrics((prev) => ({
                ...prev,
                dbRequestCount: prev.dbRequestCount + 1,
                lastDbRequestTime: requestTime,
                totalDbRequestTime: prev.totalDbRequestTime + requestTime,
            }));
        }
    };

    // Get performance summary
    const getPerformanceSummary = () => ({
        component: componentName,
        ...metrics,
        averageDbRequestTime:
            metrics.dbRequestCount > 0
                ? metrics.totalDbRequestTime / metrics.dbRequestCount
                : 0,
    });

    // Check if performance is concerning
    const isPerformanceConcerning = () => ({
        slowRenders: metrics.averageRenderTime > 50, // Over 50ms
        tooManyRenders: metrics.renderCount > 100, // More than 100 renders
        slowDbRequests:
            metrics.dbRequestCount > 0 &&
            metrics.totalDbRequestTime / metrics.dbRequestCount > 1000, // Over 1 second average
        highMemoryUsage: metrics.memoryUsage && metrics.memoryUsage > 100, // Over 100MB
    });

    // Log performance warnings
    useEffect(() => {
        const concerns = isPerformanceConcerning();
        const hasAnyConcerns = Object.values(concerns).some(Boolean);

        if (hasAnyConcerns) {
            console.warn(
                `Performance concerns detected in ${componentName}:`,
                concerns
            );
        }
    }, [componentName, metrics]);

    return {
        metrics,
        startDbRequest,
        endDbRequest,
        getPerformanceSummary,
        isPerformanceConcerning,
    };
};
