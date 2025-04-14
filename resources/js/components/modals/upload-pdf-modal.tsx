import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";

interface UploadPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function UploadPdfModal({ open, onOpenChange, folders }: UploadPdfModalProps) {
    const [noteTitle, setNoteTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const { createNote, isUploading } = useCreateNote();

    const handleSubmit = async () => {
        if (!pdfFile || !selectedFolder) return;

        const success = await createNote('pdf', {
            title: noteTitle,
            folder_id: selectedFolder,
            pdf_file: pdfFile
        });

        // if (success) {
        //     setNoteTitle('');
        //     setSelectedFolder('');
        //     setPdfFile(null);
        //     onOpenChange(false);
        // }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload PDF/Text</DialogTitle>
                    <DialogDescription>
                        Create a new note from a PDF or text file
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="note-title" className="text-right">Title</Label>
                        <Input
                            id="note-title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            className="col-span-3"
                            placeholder="Enter note title"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file-upload" className="text-right">File</Label>
                        <Input
                            id="file-upload"
                            type="file"
                            className="col-span-3"
                            accept=".pdf,.txt,.doc,.docx"
                            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="folder" className="text-right">Folder</Label>
                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                            <SelectContent>
                                {folders.map((folder) => (
                                    <SelectItem key={folder.id} value={folder.id.toString()}>
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit}
                        disabled={!pdfFile || isUploading}
                    >
                        {isUploading ? 'Creating...' : 'Create Note'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}