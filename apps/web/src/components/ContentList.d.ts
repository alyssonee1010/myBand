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
}
export default function ContentList({ contents, onDelete }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContentList.d.ts.map