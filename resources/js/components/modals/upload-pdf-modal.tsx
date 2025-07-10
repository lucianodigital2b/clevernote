import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import { useTranslation } from 'react-i18next';
import type { Folder } from "@/types";
import { Dropzone } from "../ui/dropzone";
import languages from "@/utils/languages.json";

interface UploadPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

export function UploadPdfModal({ open, onOpenChange, folders }: UploadPdfModalProps) {
    const { t } = useTranslation();
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
                    <DialogTitle>{t('upload_pdf_modal_title')}</DialogTitle>
                    <DialogDescription>
                        {t('upload_pdf_modal_description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>{t('upload_pdf_modal_file')}</Label>
                        <Dropzone
                            onDrop={(files) => setPdfFile(files[0])}
                            accept={{
                                'application/pdf': ['.pdf'],
                                'text/plain': ['.txt'],
                                'application/msword': ['.doc'],
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                                'application/vnd.ms-powerpoint': ['.ppt'],
                                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
                            }}
                        />
                        
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="note-title">{t('upload_pdf_modal_title_optional')}</Label>
                        <Input
                            id="note-title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder={t('modal_title_placeholder')}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="folder">{t('upload_pdf_modal_folder_optional')}</Label>
                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('modal_select_folder')} />
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
                        <Label htmlFor="language">{t('modal_language')}</Label>
                        <Select
                            value={selectedLanguage}
                            onValueChange={setSelectedLanguage}
                            disabled={isUploading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('modal_select_language')} />
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
                        {isUploading ? t('Creating...') : t('modal_create_note')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}