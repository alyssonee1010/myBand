interface PreviewContent {
    id: string;
    title: string;
    description?: string;
    contentType: string;
}
interface Props {
    content: PreviewContent;
    fileUrl: string | null;
    loading: boolean;
    error: string;
    onClose: () => void;
}
export default function ContentPreviewModal({ content, fileUrl, loading, error, onClose }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContentPreviewModal.d.ts.map