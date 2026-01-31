/**
 * Simple in-memory LRU Cache for AI responses
 * Prevents redundant API calls for identical prompts
 */

interface CacheEntry<T> {
    value: T;
    timestamp: number;
    expiresAt: number;
}

export class AICache {
    private cache: Map<string, CacheEntry<any>>;
    private readonly maxSize: number;
    private readonly ttl: number;

    constructor(maxSize: number = 100, ttlSeconds: number = 3600) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttlSeconds * 1000;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Refresh LRU order
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value as T;
    }

    set<T>(key: string, value: T): void {
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entry (first key in Map)
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.ttl
        });
    }

    generateKey(prompt: string, ...args: any[]): string {
        const data = JSON.stringify({ prompt, args });
        // Simple hash to keep keys manageable (optional, but good for logging)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `ai_cache_${hash}_${data.length}`;
    }

    clear(): void {
        this.cache.clear();
    }
}

// Singleton instance
export const aiCache = new AICache();
