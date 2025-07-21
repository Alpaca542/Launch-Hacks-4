/**
 * CacheDebugPanel - A debug component to display cache statistics
 * Useful for monitoring cache performance and optimizing read operations
 */

import React from "react";
import { useCacheStats } from "../services/cacheService";

interface CacheDebugPanelProps {
    isVisible: boolean;
    onToggle: () => void;
}

export const CacheDebugPanel: React.FC<CacheDebugPanelProps> = ({
    isVisible,
    onToggle,
}) => {
    const cacheStats = useCacheStats();

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 text-xs"
                title="Show Cache Stats"
            >
                📊
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                    Cache Statistics
                </h3>
                <button
                    onClick={onToggle}
                    className="text-gray-500 hover:text-gray-700 text-lg"
                    title="Hide Cache Stats"
                >
                    ×
                </button>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-gray-600">Hit Rate:</span>
                    <span
                        className={`font-medium ${
                            cacheStats.hitRate > 70
                                ? "text-green-600"
                                : cacheStats.hitRate > 40
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                    >
                        {cacheStats.hitRate.toFixed(1)}%
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Cache Hits:</span>
                    <span className="font-medium text-green-600">
                        {cacheStats.hits}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Cache Misses:</span>
                    <span className="font-medium text-red-600">
                        {cacheStats.misses}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">DB Reads:</span>
                    <span className="font-medium text-blue-600">
                        {cacheStats.reads}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Cache Size:</span>
                    <span className="font-medium">{cacheStats.cacheSize}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Evictions:</span>
                    <span className="font-medium text-orange-600">
                        {cacheStats.evictions}
                    </span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <div className="text-center text-gray-500">
                        {cacheStats.reads < 10
                            ? "Gathering data..."
                            : `${(
                                  (cacheStats.hits /
                                      (cacheStats.hits + cacheStats.misses)) *
                                  100
                              ).toFixed(1)}% cache efficiency`}
                    </div>
                </div>
            </div>

            <div className="mt-3 text-xs text-gray-400 text-center">
                {cacheStats.reads === 0
                    ? "No database reads yet"
                    : `Saved ${cacheStats.hits} database reads`}
            </div>
        </div>
    );
};
