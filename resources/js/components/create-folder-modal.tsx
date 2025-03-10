import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderIcon } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

type CreateFolderModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function CreateFolderModal({ isOpen, onClose }: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const maxChars = 30;

    // Reset the input when the modal opens
    useEffect(() => {
        if (isOpen) {
            setFolderName('');
            setCharCount(0);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= maxChars) {
            setFolderName(value);
            setCharCount(value.length);
        }
    };

    const handleSave = () => {
        if (folderName.trim()) {
            setIsSubmitting(true);
            
            // Make a request to the folders route
            router.post('/folders', {
                name: folderName.trim(),
            }, {
                preserveState: true,
                onSuccess: () => {
                    // Use a timeout to ensure the toast is shown after the modal closes
                    setTimeout(() => {
                        toast.success('Folder created successfully');
                    }, 100);
                    onClose();
                },
                onError: (errors) => {
                    console.error('Folder creation errors:', errors);
                    if (errors.name) {
                        toast.error(errors.name);
                    } else {
                        toast.error('Failed to create folder');
                    }
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        }
    };

    // Handle Enter key press
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && folderName.trim() && !isSubmitting) {
            handleSave();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(isOpen) => {
            if (!isOpen && !isSubmitting) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        <span>Create New Folder</span>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                placeholder="Enter folder name"
                                value={folderName}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className="pr-16"
                                autoFocus
                                maxLength={maxChars}
                                disabled={isSubmitting}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                {charCount}/{maxChars}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={!folderName.trim() || isSubmitting}
                            className="bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}