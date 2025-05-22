import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";
import { usePage } from "@inertiajs/react";
import InputError from "../input-error";
import { Dropzone } from "@/components/ui/dropzone";
import languages from "@/utils/languages.json";

interface UploadAudioModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function UploadAudioModal({ open, onOpenChange, folders }: UploadAudioModalProps) {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [selectedFolder, setSelectedFolder] = useState(folders.length > 0 ? folders[0].id.toString() : '');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('autodetect'); // Add type annotation and initialize with empty string

    const [noteTitle, setNoteTitle] = useState('');
    const { createNote, isUploading, uploadProgress } = useCreateNote();
    // const { errors } = usePage().props

    const handleSubmit = async () => {
        
        if (!audioFile) return;

        const success = await createNote('audio', {
            title: noteTitle || audioFile.name,
            folder_id: selectedFolder,
            audio_file: audioFile,
            language: selectedLanguage
        });

        if (success && success.id) {
            onOpenChange(false, true, success.id);
        } else if (success === null) {
             // Handle error case if createNote returns null
             onOpenChange(false, false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) {
                setAudioFile(null);
                setSelectedFolder('');
                setNoteTitle('');
            }
            onOpenChange(open);
        }}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Upload Audio</DialogTitle>
                    <DialogDescription>
                        Create a new note from an audio file. The audio will be transcribed automatically.
                    </DialogDescription>
                </DialogHeader>

                {/* {flash.message && (
                    <div class="alert">{flash.message}</div>
                )}
                {children} */}


                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="audio-upload">
                            Audio
                        </Label>
                        <Dropzone
                            onDrop={(files) => setAudioFile(files[0])}
                            accept={{
                                'audio/*': []
                            }}
                            className="w-full"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="note-title">
                            Title (optional)
                        </Label>
                        <Input
                            id="note-title"
                            type="text"
                            placeholder="Enter note title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="language">
                            Language
                        </Label>
                        <Select
                            value={selectedLanguage}
                            onValueChange={setSelectedLanguage}
                            disabled={isUploading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select audio language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="folder">
                            Folder (optional)
                        </Label>
                        <Select
                            value={selectedFolder}
                            onValueChange={setSelectedFolder}
                            disabled={isUploading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                            <SelectContent>
                                {folders.map((folder: Folder) => (
                                    <SelectItem key={folder.id} value={folder.id.toString()}>
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {isUploading && (
                        <div>
                            <div className="space-y-2">
                                <div className="text-sm text-neutral-500 text-center">
                                    {uploadProgress < 100 ? 'Uploading audio...' : 'Transcribing audio...'}
                                </div>
                                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit}
                        disabled={isUploading || !audioFile}
                    >
                        {isUploading ? 'Processing...' : 'Create Note'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}