import React from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Zap, Clock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface StudyModeSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flashcardSetId: number | null;
    onModeSelect?: (mode: 'fast' | 'spaced') => void;
}

export const StudyModeSelectionModal: React.FC<StudyModeSelectionModalProps> = ({
    open,
    onOpenChange,
    flashcardSetId,
    onModeSelect
}) => {
    const { t } = useTranslation();

    const handleFastReviewMode = () => {
        onOpenChange(false);
        if (onModeSelect) {
            onModeSelect('fast');
        } else if (flashcardSetId) {
            router.visit(`/flashcard-sets/${flashcardSetId}/study?mode=fast`);
        }
    };

    const handleSpacedRepetitionMode = () => {
        onOpenChange(false);
        if (onModeSelect) {
            onModeSelect('spaced');
        } else if (flashcardSetId) {
            router.visit(`/flashcard-sets/${flashcardSetId}/study`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">{t('study_mode_selection_title')}</DialogTitle>
                    <DialogDescription className="text-center">
                        {t('study_mode_selection_description')}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 gap-4 py-4">
                    {/* Fast Review Mode */}
                    <Card 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                        onClick={handleFastReviewMode}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{t('fast_review_title')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {t('fast_review_description')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Spaced Repetition Mode */}
                    <Card 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
                        onClick={handleSpacedRepetitionMode}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{t('spaced_repetition_title')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {t('spaced_repetition_description')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};