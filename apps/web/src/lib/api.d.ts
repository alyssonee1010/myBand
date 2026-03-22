declare const apiClient: import("axios").AxiosInstance;
export declare const authApi: {
    register: (email: string, password: string, name?: string) => Promise<any>;
    login: (email: string, password: string) => Promise<any>;
    getProfile: () => Promise<any>;
};
export declare const groupApi: {
    createGroup: (name: string, description?: string) => Promise<any>;
    getGroup: (groupId: string) => Promise<any>;
    addMember: (groupId: string, email: string) => Promise<any>;
};
export declare const contentApi: {
    uploadContent: (groupId: string, title: string, description: string, file: File) => Promise<any>;
    addTextContent: (groupId: string, title: string, textContent: string, contentType: string, description?: string) => Promise<any>;
    getGroupContent: (groupId: string) => Promise<any>;
    deleteContent: (groupId: string, contentId: string) => Promise<any>;
};
export declare const setlistApi: {
    createSetlist: (groupId: string, name: string) => Promise<any>;
    getGroupSetlists: (groupId: string) => Promise<any>;
    getSetlist: (groupId: string, setlistId: string) => Promise<any>;
    addItemToSetlist: (groupId: string, setlistId: string, contentId: string) => Promise<any>;
    reorderSetlistItems: (groupId: string, setlistId: string, items: Array<{
        itemId: string;
        position: number;
    }>) => Promise<any>;
    removeItemFromSetlist: (groupId: string, setlistId: string, itemId: string) => Promise<any>;
};
export default apiClient;
//# sourceMappingURL=api.d.ts.map