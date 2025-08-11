import { cn } from "@/lib/utils";
import { UploadIcon, Trash2Icon, FileIcon, ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
    onDrop: (files: File[]) => void;
    accept?: Record<string, string[]>;
    className?: string;
}

function getFileIcon(file: File) {
    if (file.type.startsWith("image/")) {
        return <ImageIcon className="h-6 w-6 text-rose-700" />;
    }
    // Add more type checks if needed
    return <FileIcon className="h-6 w-6 text-rose-700" />;
}

function getFileSize(file: File) {
    if (!file) return "";
    const size = file.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function Dropzone({ onDrop, accept, className }: DropzoneProps) {
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isFading, setIsFading] = useState(false);

    const handleDrop = useCallback((acceptedFiles: File[]) => {
        setError(null);
        setIsFading(false);
        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
            onDrop(acceptedFiles);
        }
    }, [onDrop]);

    const handleRemove = () => {
        setIsFading(true);
        setTimeout(() => {
            setSelectedFile(null);
            setIsFading(false);
            onDrop([]);
        }, 300); // 300ms matches the CSS transition
    };

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop: handleDrop,
        accept,
        multiple: false,
        noClick: true,
        onDropRejected: (rejections) => {
            const rejection = rejections[0];
            if (rejection) {
                setError(rejection.errors[0]?.message || 'Invalid file type');
            }
        }
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 transition-colors text-center",
                    isDragActive 
                        ? "border-primary bg-primary/5" 
                        : "border-neutral-200 dark:border-neutral-800 hover:border-primary",
                    error && "border-red-500 bg-red-50 dark:bg-red-900/10",
                    className
                )}
            >
                <input {...getInputProps()} />
                <div 
                    className="flex flex-col items-center gap-2 cursor-pointer" 
                    onClick={open}
                >
                    <UploadIcon className="h-8 w-8 text-neutral-400" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {isDragActive 
                            ? "Drop the file here"
                            : "Drag & drop a file here, or click to select"
                        }
                    </p>
                </div>
            </div>
            {selectedFile && (
                <div
                    className={cn(
                        "mt-4 flex items-center border rounded-lg px-4 py-2 bg-white dark:bg-neutral-900 shadow-sm relative transition-opacity duration-300",
                        isFading ? "opacity-0" : "opacity-100"
                    )}
                >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getFileIcon(selectedFile)}
                        <div className="min-w-0 flex-1">
                            <div className="font-medium break-words text-sm leading-tight">{selectedFile.name}</div>
                            <div className="text-xs text-neutral-500">
                                .{selectedFile.name.split('.').pop()?.toLowerCase() || ''} &bull; {getFileSize(selectedFile)}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ml-auto rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        onClick={handleRemove}
                        aria-label="Remove file"
                        disabled={isFading}
                    >
                        <Trash2Icon className="h-5 w-5 text-neutral-500" />
                    </button>
                </div>
            )}
            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
        </div>
    );
}