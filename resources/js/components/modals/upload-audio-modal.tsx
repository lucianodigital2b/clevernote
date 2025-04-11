import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";
import { usePage } from "@inertiajs/react";

interface UploadAudioModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function UploadAudioModal({ open, onOpenChange, folders }: UploadAudioModalProps) {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [noteTitle, setNoteTitle] = useState('');
    const { createNote, isUploading, uploadProgress } = useCreateNote();
    const { errors } = usePage().props

    const handleSubmit = async () => {
        
        if (!audioFile) return;

        const success = await createNote('audio', {
            title: noteTitle || audioFile.name,
            folder_id: selectedFolder,
            audio_file: audioFile,
            language: selectedLanguage
        });

        console.log(success);
        
        // if (success) {
        //     setAudioFile(null);
        //     setSelectedFolder('');
        //     setNoteTitle('');
        //     onOpenChange(false);
        // }
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
            <DialogContent className="sm:max-w-[425px]">
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="note-title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="note-title"
                            type="text"
                            className="col-span-3"
                            placeholder="Enter note title (optional)"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            disabled={isUploading}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="audio-upload" className="text-right">
                            Audio
                        </Label>
                        <Input
                            id="audio-upload"
                            type="file"
                            className="col-span-3"
                            accept="audio/*"
                            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                            required
                            disabled={isUploading}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="language" className="text-right">
                            Language
                        </Label>
                        <Select
                            value={selectedLanguage}
                            onValueChange={setSelectedLanguage}
                            disabled={isUploading}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select audio language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="it">Italian</SelectItem>
                                <SelectItem value="pt">Portuguese</SelectItem>
                                <SelectItem value="nl">Dutch</SelectItem>
                                <SelectItem value="ru">Russian</SelectItem>
                                <SelectItem value="ja">Japanese</SelectItem>
                                <SelectItem value="ko">Korean</SelectItem>
                                <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                                <SelectItem value="ar">Arabic</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                                <SelectItem value="tr">Turkish</SelectItem>
                                <SelectItem value="pl">Polish</SelectItem>
                                <SelectItem value="vi">Vietnamese</SelectItem>
                                <SelectItem value="th">Thai</SelectItem>
                                <SelectItem value="id">Indonesian</SelectItem>
                                <SelectItem value="ms">Malay</SelectItem>
                                <SelectItem value="fa">Persian</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="folder" className="text-right">
                            Folder
                        </Label>
                        <Select
                            value={selectedFolder}
                            onValueChange={setSelectedFolder}
                            disabled={isUploading}
                        >
                            <SelectTrigger className="col-span-3">
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
                        <div className="col-span-4">
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