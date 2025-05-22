import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";
import { Dropzone } from "../ui/dropzone";
import languages from "@/utils/languages.json";

interface UploadPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function UploadPdfModal({ open, onOpenChange, folders }: UploadPdfModalProps) {
    const [noteTitle, setNoteTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('autodetect');
    const { createNote, isUploading } = useCreateNote();

    const handleSubmit = async () => {
        if (!pdfFile) return;

        const success = await createNote('pdf', {
            title: noteTitle,
            folder_id: selectedFolder,
            pdf_file: pdfFile,
            language: selectedLanguage
        });

        // if (success) {
        //     setNoteTitle('');
        //     setSelectedFolder('');
        //     setPdfFile(null);
        //     onOpenChange(false);
        if (success && success.id) {
            setNoteTitle('');
            setSelectedFolder('');
            setPdfFile(null);
            onOpenChange(false, true, success.id);
        } else if (success === null) {
            // Handle error case if createNote returns null
            onOpenChange(false, false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Upload PDF/Text</DialogTitle>
                    <DialogDescription>
                        Create a new note from a PDF or text file
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>File</Label>
                        <Dropzone
                            onDrop={(files) => setPdfFile(files[0])}
                            accept={{
                                'application/pdf': ['.pdf'],
                                'text/plain': ['.txt'],
                                'application/msword': ['.doc'],
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                            }}
                        />
                        {pdfFile && (
                            <p className="text-sm text-neutral-500 mt-2">
                                Selected: {pdfFile.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="note-title">Title (optional)</Label>
                        <Input
                            id="note-title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="Enter note title"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="folder">Folder (optional)</Label>
                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                            <SelectTrigger>
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
                    <div className="grid gap-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                            value={selectedLanguage}
                            onValueChange={setSelectedLanguage}
                            disabled={isUploading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
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