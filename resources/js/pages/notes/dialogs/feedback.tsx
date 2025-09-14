import React from 'react'
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';


type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    feedbackReason: string;
    setFeedbackReason: (reason: string) => void;
};

export function Feedback({ isOpen, onClose, onSubmit, feedbackReason, setFeedbackReason }: ModalProps) {

    const handleSubmit = () => {
        onSubmit(feedbackReason);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">What was the issue with this note?</h3>
                    <textarea 
                        className="w-full p-2 border rounded min-h-[100px]"
                        value={feedbackReason}
                        onChange={(e) => setFeedbackReason(e.target.value)}
                        placeholder="Please describe the issue..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!feedbackReason.trim()}>
                            Submit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}