interface Content {
    id: string;
    title: string;
    contentType: string;
    description?: string;
    createdBy: {
        id: string;
        name?: string;
        email: string;
    };
}
interface Props {
    contents: Content[];
    onDelete: (contentId: string) => Promise<void>;
    onRename: (contentId: string, title: string) => Promise<void>;
}
export default function ContentList({ contents, onDelete, onRename }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContentList.d.ts.map