import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import { Mic } from "lucide-react";
import type { Folder } from "@/types";

interface RecordAudioModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function RecordAudioModal({ open, onOpenChange, folders }: RecordAudioModalProps) {
    const [noteTitle, setNoteTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const { createNote, isUploading } = useCreateNote();

    const handleRecording = async () => {
        if (isRecording) {
            mediaRecorder?.stop();
            setIsRecording(false);
            return;
        }

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Media devices API is not supported');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Failed to access microphone. Please check permissions.');
        }
    };

    const handleSubmit = async () => {
        if (!audioBlob || !selectedFolder) return;

        const success = await createNote('record', {
            title: noteTitle,
            folder_id: selectedFolder,
            audio_file: audioBlob,
            language: selectedLanguage
        });

        if (success) {
            setNoteTitle('');
            setSelectedFolder('');
            setAudioBlob(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) {
                setAudioBlob(null);
                setIsRecording(false);
                mediaRecorder?.stop();
            }
            onOpenChange(open);
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Audio</DialogTitle>
                    <DialogDescription>
                        Create a new note with recorded audio
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
                    <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="col-span-4 flex justify-center">
                                <Button 
                                    variant="outline" 
                                    className={`rounded-full h-16 w-16 flex items-center justify-center ${isRecording ? 'bg-red-50 border-red-500' : ''}`}
                                    onClick={handleRecording}
                                >
                                    <Mic className={`h-6 w-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`} />
                                </Button>
                            </div>
                            <div className="col-span-4 text-center text-sm text-neutral-500">
                                {isRecording ? 'Recording... Click to stop' : audioBlob ? 'Recording complete' : 'Click to start recording'}
                            </div>
                        </div>
                        {audioBlob && (
                            <div className="col-span-4 mt-4">
                                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                                    <audio
                                        src={URL.createObjectURL(audioBlob)}
                                        controls
                                        className="w-full"
                                    />
                                    <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
                                        <span>Preview your recording</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAudioBlob(null);
                                                setIsRecording(false);
                                            }}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            Delete recording
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit}
                        disabled={!audioBlob || isUploading}
                    >
                        {isUploading ? 'Creating...' : 'Create Note'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}