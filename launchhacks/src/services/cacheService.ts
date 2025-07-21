/**
 * Cache service for optimizing Firestore reads and improving performance
 * Implements in-memory caching with TTL, local storage persistence, and request deduplication
 */

import { BoardData } from "../services/boardService";

// Cache configuration
const CACHE_CONFIG = {
    TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
    STORAGE_PREFIX: "launchhacks_cache_",
    MAX_CACHE_SIZE: 50, // Maximum number of cached items per type
};

// Cache entry interface
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

// Cache statistics for monitoring
interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    reads: number;
}

class CacheService {
    private memoryCache = new Map<string, CacheEntry<any>>();
    private pendingRequests = new Map<string, Promise<any>>();
    private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, reads: 0 };

    /**
     * Generate cache key
     */
    private generateKey(type: string, identifier: string): string {
        return `${type}_${identifier}`;
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry<any>): boolean {
        return entry.expiresAt > Date.now();
    }

    /**
     * Get data from memory cache
     */
    private getFromMemory<T>(key: string): T | null {
        const entry = this.memoryCache.get(key);
        if (entry && this.isValid(entry)) {
            this.stats.hits++;
            return entry.data;
        }
        if (entry) {
            // Remove expired entry
            this.memoryCache.delete(key);
        }
        return null;
    }

    /**
     * Get data from local storage
     */
    private getFromStorage<T>(key: string): T | null {
        try {
            const stored = localStorage.getItem(
                CACHE_CONFIG.STORAGE_PREFIX + key
            );
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                if (this.isValid(entry)) {
                    // Restore to memory cache
                    this.memoryCache.set(key, entry);
                    this.stats.hits++;
                    return entry.data;
                } else {
                    // Remove expired entry from storage
                    localStorage.removeItem(CACHE_CONFIG.STORAGE_PREFIX + key);
                }
            }
        } catch (error) {
            console.warn("Error reading from cache storage:", error);
        }
        return null;
    }

    /**
     * Store data in both memory and local storage
     */
    private store<T>(key: string, data: T, customTTL?: number): void {
        const now = Date.now();
        const ttl = customTTL || CACHE_CONFIG.TTL;
        const entry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        };

        // Store in memory
        this.memoryCache.set(key, entry);

        // Store in local storage (with error handling)
        try {
            localStorage.setItem(
                CACHE_CONFIG.STORAGE_PREFIX + key,
                JSON.stringify(entry)
            );
        } catch (error) {
            console.warn("Error storing to local storage:", error);
            // If storage is full, try to clean up
            this.cleanupStorage();
        }

        // Prevent memory cache from growing too large
        if (this.memoryCache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
            this.evictOldest();
        }
    }

    /**
     * Clean up old entries from local storage
     */
    private cleanupStorage(): void {
        const keysToRemove: string[] = [];
        const now = Date.now();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
                try {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const entry = JSON.parse(stored);
                        if (entry.expiresAt < now) {
                            keysToRemove.push(key);
                        }
                    }
                } catch (error) {
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach((key) => {
            localStorage.removeItem(key);
            this.stats.evictions++;
        });
    }

    /**
     * Evict oldest entries from memory cache
     */
    private evictOldest(): void {
        let oldestKey = "";
        let oldestTime = Date.now();

        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Get data from cache with fallback to fetch function
     */
    async get<T>(
        type: string,
        identifier: string,
        fetchFn: () => Promise<T>,
        customTTL?: number
    ): Promise<T> {
        const key = this.generateKey(type, identifier);

        // Check memory cache first
        const memoryResult = this.getFromMemory<T>(key);
        if (memoryResult !== null) {
            return memoryResult;
        }

        // Check local storage
        const storageResult = this.getFromStorage<T>(key);
        if (storageResult !== null) {
            return storageResult;
        }

        // Check for pending request to avoid duplicate API calls
        const pendingRequest = this.pendingRequests.get(key);
        if (pendingRequest) {
            return pendingRequest;
        }

        // Fetch fresh data
        this.stats.misses++;
        this.stats.reads++;

        const fetchPromise = fetchFn()
            .then((data) => {
                this.store(key, data, customTTL);
                this.pendingRequests.delete(key);
                return data;
            })
            .catch((error) => {
                this.pendingRequests.delete(key);
                throw error;
            });

        this.pendingRequests.set(key, fetchPromise);
        return fetchPromise;
    }

    /**
     * Set data directly in cache
     */
    set<T>(
        type: string,
        identifier: string,
        data: T,
        customTTL?: number
    ): void {
        const key = this.generateKey(type, identifier);
        this.store(key, data, customTTL);
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(type: string, identifier: string): void {
        const key = this.generateKey(type, identifier);
        this.memoryCache.delete(key);
        localStorage.removeItem(CACHE_CONFIG.STORAGE_PREFIX + key);
    }

    /**
     * Invalidate all cache entries for a type
     */
    invalidateType(type: string): void {
        // Remove from memory cache
        const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
            key.startsWith(type + "_")
        );
        keysToDelete.forEach((key) => this.memoryCache.delete(key));

        // Remove from local storage
        const storageKeysToDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
                key &&
                key.startsWith(CACHE_CONFIG.STORAGE_PREFIX + type + "_")
            ) {
                storageKeysToDelete.push(key);
            }
        }
        storageKeysToDelete.forEach((key) => localStorage.removeItem(key));
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.memoryCache.clear();
        this.pendingRequests.clear();

        // Clear local storage entries
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: number; cacheSize: number } {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
            cacheSize: this.memoryCache.size,
        };
    }

    /**
     * Preload data for common access patterns
     */
    async preloadUserData(
        userId: string,
        boardFetchFn: () => Promise<BoardData[]>
    ): Promise<void> {
        try {
            // Preload user's boards
            const boards = await this.get(
                "boards",
                userId,
                boardFetchFn,
                CACHE_CONFIG.TTL * 2
            );

            // Preload the open board's nodes and edges
            const openBoard = boards.find((board) => board.isOpen);
            if (openBoard) {
                // These will be loaded when needed, but we can prepare the cache keys
                console.log(
                    `Preloaded data for user ${userId} with ${boards.length} boards`
                );
            }
        } catch (error) {
            console.warn("Error preloading user data:", error);
        }
    }
}

// Create singleton instance
const cacheService = new CacheService();

// Export cache service and utility functions
export { cacheService };

// Export type for use in other files
export type { CacheStats };

// Utility hook for cache statistics (for debugging)
export const useCacheStats = () => {
    return cacheService.getStats();
};
