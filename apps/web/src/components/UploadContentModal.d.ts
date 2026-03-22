interface Props {
    onClose: () => void;
    onUpload: (title: string, description: string, file: File) => Promise<void>;
}
export default function UploadContentModal({ onClose, onUpload }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=UploadContentModal.d.ts.map