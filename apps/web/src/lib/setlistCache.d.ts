interface CacheableSetlistItem {
    content: {
        id: string;
        title: string;
        fileUrl?: string | null;
    };
}
export interface SetlistCacheStatus {
    supported: boolean;
    totalCount: number;
    cachedCount: number;
    isFullyCached: boolean;
    cachedAt: string | null;
}
export interface SetlistCacheProgress {
    completed: number;
    total: number;
    title: string;
}
export declare function isSetlistCacheSupported(): boolean;
export declare function getCacheableSetlistItems<T extends CacheableSetlistItem>(items: T[]): T[];
export declare function getCachedContentFile(groupId: string, contentId: string): Promise<Blob | null>;
export declare function getSetlistCacheStatus(groupId: string, setlistId: string, contentIds: string[]): Promise<SetlistCacheStatus>;
export declare function cacheSetlistFiles<T extends CacheableSetlistItem>(groupId: string, setlistId: string, items: T[], fetchContentFile: (groupId: string, contentId: string) => Promise<Blob>, onProgress?: (progress: SetlistCacheProgress) => void): Promise<{
    cachedCount: number;
    totalCount: number;
}>;
export declare function clearSetlistCache(groupId: string, setlistId: string, contentIds: string[]): Promise<void>;
export {};
//# sourceMappingURL=setlistCache.d.ts.map