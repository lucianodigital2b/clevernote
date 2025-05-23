import { Dropzone } from "@/components/ui/dropzone";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";
import languages from "@/utils/languages.json";

interface WebLinkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function WebLinkModal({ open, onOpenChange, folders }: WebLinkModalProps) {
    const [webLink, setWebLink] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>("autodetect"); // Add type annotation and initialize with empty string
    const { createNote, isUploading } = useCreateNote();

    const handleSubmit = async () => {
        if (!webLink) return;

        const success = await createNote('weblink', {
            folder_id: selectedFolder,
            link: webLink,
            language: selectedLanguage
        });

        if (success && success.id) {
            setWebLink('');
            setSelectedFolder('');
            setSelectedLanguage('autodetect');
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
                    <DialogTitle>Add from Youtube</DialogTitle>
                    <DialogDescription>
                        Create a new note from a youtube video
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="web-link">URL</Label>
                        <Input
                            id="web-link"
                            value={webLink}
                            onChange={(e) => setWebLink(e.target.value)}
                            placeholder="https://example.com"
                            required
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
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
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
                        disabled={!webLink || isUploading}
                    >
                        {isUploading ? 'Creating...' : 'Create Note'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}