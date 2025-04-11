import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";

interface WebLinkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function WebLinkModal({ open, onOpenChange, folders }: WebLinkModalProps) {
    const [webLink, setWebLink] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const { createNote, isUploading } = useCreateNote();

    const handleSubmit = async () => {
        if (!webLink || !selectedFolder) return;

        const success = await createNote('weblink', {
            folder_id: selectedFolder,
            title: webLink
        });

        if (success) {
            setWebLink('');
            setSelectedFolder('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Web Link</DialogTitle>
                    <DialogDescription>
                        Create a new note from a web link
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="web-link" className="text-right">URL</Label>
                        <Input
                            id="web-link"
                            value={webLink}
                            onChange={(e) => setWebLink(e.target.value)}
                            className="col-span-3"
                            placeholder="https://example.com"
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
                        disabled={!webLink || isUploading}
                    >
                        {isUploading ? 'Creating...' : 'Create Note'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}