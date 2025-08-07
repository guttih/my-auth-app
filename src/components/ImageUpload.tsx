import { useState, useEffect } from "react";

interface ImageUploadProps {
    value?: string; // existing image URL (e.g. /uploads/avatars/user-123.jpg)
    onChange: (file: File | null) => void; // now returns File, not uploaded path
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        // If no preview but we have a value, use it
        if (!previewUrl && value) {
            setPreviewUrl(value);
        }
    }, [value]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        onChange(file); // pass the raw file to parent
    }

    return (
        <div className="space-y-2">
            {previewUrl && <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-full border" />}
            <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
    );
}
