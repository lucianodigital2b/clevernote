import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import { useTranslation } from 'react-i18next';
import type { Folder } from "@/types";
import { Dropzone } from "../ui/dropzone";
import { ChevronDown, FileText, Upload } from "lucide-react";
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
    const [textContent, setTextContent] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('autodetect');
    const [isTextSectionOpen, setIsTextSectionOpen] = useState(true);
    const [isFileSectionOpen, setIsFileSectionOpen] = useState(false);
    const [validationError, setValidationError] = useState<string>('');
    const { createNote, isUploading } = useCreateNote();

    const handleSubmit = async () => {
        // Clear previous validation errors
        setValidationError('');
        
        // Validate that either file or text content is provided
        if (!pdfFile && !textContent.trim()) {
            setValidationError(t('Please provide either a file or text content to create a note.'));
            return;
        }

        const success = await createNote('pdf', {
            title: noteTitle,
            folder_id: selectedFolder,
            pdf_file: pdfFile,
            text_content: textContent.trim(),
            language: selectedLanguage
        });

        if (success && success.id) {
            setNoteTitle('');
            setSelectedFolder('');
            setPdfFile(null);
            setTextContent('');
            setValidationError('');
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
                    {/* Accordion for Text and File Input */}
                    <div className="space-y-2">
                        {/* Text Input Section */}
                        <Collapsible open={isTextSectionOpen} onOpenChange={(open) => {
                            setIsTextSectionOpen(open);
                            if (open) setIsFileSectionOpen(false);
                        }}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">{t('Enter Text')}</span>
                                </div>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isTextSectionOpen ? 'rotate-180' : ''}`} />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="text-content">{t('Text Content')}</Label>
                                    <Textarea
                                        id="text-content"
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder={t('Enter your text content here...')}
                                        className="min-h-[120px] max-h-[300px] resize-none overflow-y-auto"
                                        maxLength={10000}
                                    />
                                    <div className="text-xs text-neutral-500 text-right">
                                        {textContent.length}/10,000 characters
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {/* File Upload Section */}
                        <Collapsible open={isFileSectionOpen} onOpenChange={(open) => {
                            setIsFileSectionOpen(open);
                            if (open) setIsTextSectionOpen(false);
                        }}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    <span className="font-medium">{t('Upload File')}</span>
                                </div>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isFileSectionOpen ? 'rotate-180' : ''}`} />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-3">
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
                            </CollapsibleContent>
                        </Collapsible>
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
                {validationError && (
                    <div className="text-red-500 text-sm mt-2">
                        {validationError}
                    </div>
                )}
                <DialogFooter>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit}
                        disabled={(!pdfFile && !textContent.trim()) || isUploading}
                    >
                        {isUploading ? t('Creating...') : t('modal_create_note')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}