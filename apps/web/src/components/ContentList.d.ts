interface Content {
    id: string;
    title: string;
    contentType: string;
    description?: string;
    createdBy: {
        name: string;
        email: string;
    };
}
interface Props {
    contents: Content[];
    onDelete: (contentId: string) => Promise<void>;
    groupId: string;
}
export default function ContentList({ contents, onDelete, groupId }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContentList.d.ts.map