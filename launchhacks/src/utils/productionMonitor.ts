/**
 * Production Performance Monitor
 * Tracks key metrics and reports performance issues
 */

interface PerformanceReport {
    timestamp: string;
    sessionId: string;
    userId?: string;
    cacheStats: {
        hitRate: number;
        totalReads: number;
        cacheSizeKB: number;
    };
    renderStats: {
        averageRenderTime: number;
        slowRenderCount: number;
    };
    networkStats: {
        totalRequests: number;
        averageResponseTime: number;
        failedRequests: number;
    };
    memoryStats?: {
        usedJSHeapSizeMB: number;
        totalJSHeapSizeMB: number;
    };
}

class ProductionMonitor {
    private sessionId = Math.random().toString(36).substring(7);
    private renderTimes: number[] = [];
    private networkRequests: { duration: number; success: boolean }[] = [];

    // Track render performance
    trackRender(componentName: string, renderTime: number) {
        this.renderTimes.push(renderTime);

        // Log slow renders in production
        if (renderTime > 100) {
            console.warn(
                `Slow render detected in ${componentName}: ${renderTime.toFixed(
                    2
                )}ms`
            );
        }
    }

    // Track network requests
    trackNetworkRequest(duration: number, success: boolean) {
        this.networkRequests.push({ duration, success });
    }

    // Generate performance report
    generateReport(userId?: string): PerformanceReport {
        const cacheStats = (window as any).cacheService?.getStats() || {
            hitRate: 0,
            hits: 0,
            misses: 0,
            cacheSize: 0,
        };

        const totalReads = cacheStats.hits + cacheStats.misses;
        const averageRenderTime =
            this.renderTimes.length > 0
                ? this.renderTimes.reduce((a, b) => a + b, 0) /
                  this.renderTimes.length
                : 0;

        const slowRenderCount = this.renderTimes.filter(
            (time) => time > 50
        ).length;

        const totalRequests = this.networkRequests.length;
        const averageResponseTime =
            totalRequests > 0
                ? this.networkRequests.reduce(
                      (sum, req) => sum + req.duration,
                      0
                  ) / totalRequests
                : 0;

        const failedRequests = this.networkRequests.filter(
            (req) => !req.success
        ).length;

        let memoryStats;
        if ("memory" in performance) {
            const mem = (performance as any).memory;
            memoryStats = {
                usedJSHeapSizeMB: mem.usedJSHeapSize / 1024 / 1024,
                totalJSHeapSizeMB: mem.totalJSHeapSize / 1024 / 1024,
            };
        }

        return {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId,
            cacheStats: {
                hitRate: cacheStats.hitRate,
                totalReads,
                cacheSizeKB: cacheStats.cacheSize * 0.1, // Rough estimate
            },
            renderStats: {
                averageRenderTime,
                slowRenderCount,
            },
            networkStats: {
                totalRequests,
                averageResponseTime,
                failedRequests,
            },
            memoryStats,
        };
    }

    // Send performance report (implement your analytics endpoint)
    async sendReport(userId?: string) {
        const report = this.generateReport(userId);

        // In a real app, send to your analytics service
        console.log("Performance Report:", report);

        // Example: Send to your backend
        try {
            await fetch("/api/performance-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(report),
            });
        } catch (error) {
            console.warn("Failed to send performance report:", error);
        }
    }

    // Auto-report every 5 minutes
    startAutoReporting(userId?: string) {
        setInterval(() => {
            this.sendReport(userId);
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Check for performance issues
    checkPerformanceHealth(): string[] {
        const issues: string[] = [];
        const report = this.generateReport();

        if (report.cacheStats.hitRate < 50) {
            issues.push(
                "Low cache hit rate - consider reviewing cache strategy"
            );
        }

        if (report.renderStats.averageRenderTime > 50) {
            issues.push(
                "Slow average render time - check for performance bottlenecks"
            );
        }

        if (report.renderStats.slowRenderCount > 10) {
            issues.push(
                "Many slow renders detected - investigate component optimization"
            );
        }

        if (
            report.networkStats.failedRequests /
                report.networkStats.totalRequests >
            0.1
        ) {
            issues.push(
                "High network failure rate - check connectivity and error handling"
            );
        }

        if (report.memoryStats && report.memoryStats.usedJSHeapSizeMB > 200) {
            issues.push("High memory usage - potential memory leak");
        }

        return issues;
    }
}

// Create global instance
const productionMonitor = new ProductionMonitor();

// Make available globally for debugging
(window as any).performanceMonitor = productionMonitor;

export default productionMonitor;
