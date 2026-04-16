interface Content {
    id: string;
    title: string;
    contentType: string;
    description?: string;
    fileUrl?: string | null;
    createdBy: {
        id: string;
        name?: string;
        email: string;
    };
}
interface Props {
    contents: Content[];
    onDelete: (contentId: string) => Promise<void>;
    onEdit: (contentId: string, title: string, description: string) => Promise<void>;
    onPreview: (content: Content) => void;
}
export default function ContentList({ contents, onDelete, onEdit, onPreview }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContentList.d.ts.map