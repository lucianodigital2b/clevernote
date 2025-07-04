import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, PlusCircle, RotateCw, Shuffle } from 'lucide-react';
import { FlashcardSet } from '@/types';
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import axios from 'axios';

interface Props {
    flashcardSet: FlashcardSet;
}

interface FlashcardProgress {
    id: string;
    interval: number;
    repetition: number;
    efactor: number;
    nextReview: Date;
}

interface RecallOption {
    label: string;
    interval: number;
    quality: number;
}

const Study = ({ flashcardSet }: Props) => {
    const { t } = useTranslation();
    const [progress, setProgress] = useState<FlashcardProgress[]>([]);
    const [dueIndexes, setDueIndexes] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    
    // Check if we're in fast review mode
    const urlParams = new URLSearchParams(window.location.search);
    const isFastMode = urlParams.get('mode') === 'fast';

    // Initialize progress and dueIndexes
    useEffect(() => {
        const initialProgress = flashcardSet.flashcards.map(flashcard => ({
            id: flashcard.id.toString(),
            interval: 1,
            repetition: 0,
            efactor: 2.5,
            nextReview: new Date()
        }));
        setProgress(initialProgress);

        // All cards are due at the start
        const allIndexes = flashcardSet.flashcards.map((_, idx) => idx);
        setDueIndexes(allIndexes);
        setCurrentIndex(allIndexes.length > 0 ? allIndexes[0] : null);
        setIsComplete(false);
        setIsFlipped(false);
    }, [flashcardSet]);


    // Only show cards that are due (nextReview <= now)
    useEffect(() => {
        if (progress.length === 0) return;
        const now = new Date();
        const due = progress
            .map((p, idx) => ({ idx, due: p.nextReview <= now }))
            .filter(obj => obj.due)
            .map(obj => obj.idx);
        setDueIndexes(due);
        if (due.length === 0) {
            setCurrentIndex(null);
            setIsComplete(true);
        } else if (currentIndex === null || !due.includes(currentIndex)) {
            setCurrentIndex(due[0]);
        }
    }, [progress, currentIndex]);

    const currentFlashcard = currentIndex !== null ? flashcardSet.flashcards[currentIndex] : null;
    const currentProgress = currentIndex !== null ? progress[currentIndex] : null;


    const handlePrevious = () => {
        if (dueIndexes.length === 0 || currentIndex === null) return;
        const idx = dueIndexes.indexOf(currentIndex);
        if (idx > 0) {
            setCurrentIndex(dueIndexes[idx - 1]);
            setIsFlipped(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleShuffle = () => {
        if (dueIndexes.length === 0) return;
        const shuffled = [...dueIndexes].sort(() => Math.random() - 0.5);
        setDueIndexes(shuffled);
        setCurrentIndex(shuffled[0]);
        setIsFlipped(false);
    };

    const recallOptions: RecallOption[] = isFastMode ? [
        { label: t('flashcard_recall_again'), interval: 1, quality: 0 },      // Again - show again soon
        { label: t('flashcard_recall_good'), interval: 10, quality: 3 },      // Good - normal interval
    ] : [
        { label: t('flashcard_recall_again'), interval: 1, quality: 0 },      // 1 minute - forgot completely
        { label: t('flashcard_recall_hard'), interval: 6, quality: 2 },       // 6 minutes - difficult recall
        { label: t('flashcard_recall_good'), interval: 10, quality: 3 },      // 10 minutes - normal recall
        { label: t('flashcard_recall_easy'), interval: 5760, quality: 5 },    // 4 days - easy recall
    ];

    // Fast mode navigation
    const handleNext = () => {
        if (dueIndexes.length === 0 || currentIndex === null) return;
        const currentIdx = dueIndexes.indexOf(currentIndex);
        if (currentIdx < dueIndexes.length - 1) {
            setCurrentIndex(dueIndexes[currentIdx + 1]);
            setIsFlipped(false);
        } else {
            // Reached the end, mark as complete
            setIsComplete(true);
        }
    };



    // Keyboard shortcuts for fast mode
    useEffect(() => {
        if (!isFastMode) return;
        
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            switch (e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    if (!isFlipped) {
                        handleFlip();
                    } else {
                        handleNext();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    break;
                case '1':
                    e.preventDefault();
                    if (isFlipped && recallOptions[0]) {
                        handleRecall(recallOptions[0]);
                    }
                    break;
                case '2':
                    e.preventDefault();
                    if (isFlipped && recallOptions[1]) {
                        handleRecall(recallOptions[1]);
                    }
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isFastMode, isFlipped, currentIndex, dueIndexes, recallOptions]);

    // Calculate progress percentages for visual feedback
    const getProgressPercentage = (quality: number) => {
        return (quality / 5) * 100; // Convert quality (0-5) to percentage
    };

    const getButtonVariant = (label: string) => {
        if (label === t('flashcard_recall_again')) return 'destructive';
        if (label === t('flashcard_recall_easy')) return 'default';
        return 'outline';
    };

    const getButtonColor = (label: string) => {
        if (label === t('flashcard_recall_again')) return 'bg-red-100 hover:bg-red-600 text-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-800/30 border-red-200 dark:border-red-800';
        if (label === t('flashcard_recall_hard')) return 'bg-orange-100 hover:bg-orange-600 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-800/30 border-orange-200 dark:border-orange-800';
        if (label === t('flashcard_recall_good')) return 'bg-blue-100 hover:bg-blue-600 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-800/30 border-blue-200 dark:border-blue-800';
        if (label === t('flashcard_recall_easy')) return 'bg-green-100 hover:bg-green-600 text-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30 border-green-200 dark:border-green-800';
        return '';
    };

    const handleRecall = async (option: RecallOption) => {
        if (currentIndex === null || !currentProgress) return;

        const newProgress = [...progress];
        // Calculate next review time in milliseconds
        const nextReviewTime = Date.now() + option.interval * 60 * 1000;

        newProgress[currentIndex] = {
            ...currentProgress,
            interval: option.interval,
            repetition: currentProgress.repetition + 1,
            efactor: currentProgress.efactor,
            nextReview: new Date(nextReviewTime)
        };
        setProgress(newProgress);

        try {
            await axios.post(`/flashcard-sets/${flashcardSet.id}/progress`, {
                flashcard_id: currentFlashcard!.id,
                interval: option.interval,
                repetition: newProgress[currentIndex].repetition,
                efactor: currentProgress.efactor,
                next_review: new Date(nextReviewTime).toISOString()
            });
        } catch (error) {
            console.error('Failed to update flashcard progress:', error);
            return;
        }

        // After updating progress, useEffect will update dueIndexes and currentIndex
        
        // In fast mode, automatically advance to next card after recall
        if (isFastMode) {
            setTimeout(() => {
                handleNext();
            }, 300); // Small delay to show the selection
        }
    };

    const studyProgress = dueIndexes.length === 0
        ? 100
        : ((flashcardSet.flashcards.length - dueIndexes.length) / flashcardSet.flashcards.length) * 100;

    if (isComplete) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <div className="rounded-xl border shadow-lg p-6 sm:p-8 flex flex-col items-center max-w-md w-full">
                        <div className="text-xl sm:text-2xl font-semibold mb-2 flex items-center gap-2 text-center">
                            {t('study_well_done')} <span role="img" aria-label="bee">🐝</span>
                        </div>
                        <div className="mb-6 text-white text-center">
                            {t('study_learning_continues')} <span role="img" aria-label="point">👈</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full mb-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    // Restart session: all cards due again
                                    const allIndexes = flashcardSet.flashcards.map((_, idx) => idx);
                                    // Reset progress to make all cards due
                                    const resetProgress = flashcardSet.flashcards.map(flashcard => ({
                                        id: flashcard.id.toString(),
                                        interval: 1,
                                        repetition: 0,
                                        efactor: 2.5,
                                        nextReview: new Date()
                                    }));
                                    setProgress(resetProgress);
                                    setDueIndexes(allIndexes);
                                    setCurrentIndex(allIndexes.length > 0 ? allIndexes[0] : null);
                                    setIsFlipped(false);
                                    setIsComplete(false);
                                }}
                            >
                                <RotateCw className="h-4 w-4 mr-2" />
                                {t('study_review_all')}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                asChild
                            >
                                <Link href="/flashcard-sets" className="flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    {t('study_create_new_note')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (currentIndex === null || !currentFlashcard) {
        // No cards due
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">{t('study_no_cards_due')}</h2>
                        <p className="text-gray-500">{t('study_come_back_later')}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`${t('study_title_prefix')} ${flashcardSet.name}`} />

            <div className="container mx-auto py-4 sm:py-6 px-4">
                <div className="flex items-center mb-4 sm:mb-6">
                    <Button variant="ghost" asChild className="shrink-0">
                        <Link href={`/flashcard-sets/${flashcardSet.id}`} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1 text-center px-2">
                        <h1 className="text-lg sm:text-2xl font-semibold truncate">{flashcardSet.name}</h1>
                        {isFastMode && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full mt-1">
                                <span>⚡</span>
                                <span>{t('fast_review_mode_indicator')}</span>
                            </div>
                        )}
                    </div>
                    <div className="w-9 shrink-0"></div>
                </div>

                <div className="max-w-2xl mx-auto w-full">
                    <Progress value={studyProgress} className="mb-4 sm:mb-6" />
                    {isFastMode && (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <span className="font-medium">{t('keyboard_shortcuts_label')}</span> {t('keyboard_shortcuts_help')}
                        </div>
                    )}
                    <div 
                        className="relative min-h-[300px] sm:min-h-[400px] perspective-1000 cursor-pointer"
                        onClick={handleFlip}
                    >
                        <div className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front Side */}
                            <Card className={`absolute w-full h-full backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                                <CardHeader className="flex-none">
                                    <CardTitle className="text-center">
                                        {t('study_flashcard_of', { current: currentIndex + 1, total: flashcardSet.flashcards.length })}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
                                    <div 
                                        className="text-center text-base sm:text-xl leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(currentFlashcard.question)
                                        }}
                                    />
                                </CardContent>
                            </Card>
                            
                            {/* Back Side */}
                            <Card className={`absolute w-full h-full backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                                <CardHeader className="flex-none">
                                    <CardTitle className="text-center">
                                        {t('study_flashcard_of', { current: currentIndex + 1, total: flashcardSet.flashcards.length })}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
                                    <div 
                                        className="text-center text-base sm:text-xl leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(currentFlashcard.answer)
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
                        {isFastMode ? (
                            // Fast mode navigation
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={handlePrevious}
                                    disabled={
                                        dueIndexes.length === 0 ||
                                        currentIndex === null ||
                                        dueIndexes.indexOf(currentIndex) === 0
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    {t('study_previous')}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={handleFlip}
                                    className="w-full sm:w-auto"
                                >
                                    <RotateCw className="h-4 w-4 mr-2" />
                                    {t('study_flip_card')}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={handleNext}
                                    disabled={
                                        dueIndexes.length === 0 ||
                                        currentIndex === null ||
                                        dueIndexes.indexOf(currentIndex) === dueIndexes.length - 1
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    {t('study_next')}
                                </Button>
                                <button
                                    onClick={handleShuffle}
                                    disabled={dueIndexes.length <= 1}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Shuffle cards"
                                >
                                    <Shuffle className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            // Normal spaced repetition mode
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={handlePrevious}
                                    disabled={
                                        dueIndexes.length === 0 ||
                                        currentIndex === null ||
                                        dueIndexes.indexOf(currentIndex) === 0
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    {t('study_previous')}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={handleFlip}
                                    className="w-full sm:w-auto"
                                >
                                    <RotateCw className="h-4 w-4 mr-2" />
                                    {t('study_flip_card')}
                                </Button>
                                <button
                                    onClick={handleShuffle}
                                    disabled={dueIndexes.length <= 1}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Shuffle cards"
                                >
                                    <Shuffle className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                    {/* Recall options are now always visible */}
                    <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
                        {recallOptions.map((option) => (
                            <div key={option.label} className="flex flex-col items-center">
                                <Button
                                    variant={'outline'}
                                    onClick={() => handleRecall(option)}
                                    className={`
                                        w-full sm:w-auto min-h-[60px] sm:min-h-[auto]
                                        ${getButtonColor(option.label)}
                                    `}
                                >
                                    <div className="flex gap-2 items-center justify-center h-full relative z-10">
                                        <span className="font-semibold text-xs sm:text-sm text-center leading-tight">{option.label}</span>
                                        <span className="text-xs opacity-90 font-medium">
                                            {option.interval >= 1440 
                                                ? `${Math.floor(option.interval / 1440)}d` 
                                                : option.interval >= 60 
                                                    ? `${Math.floor(option.interval / 60)}h` 
                                                    : `${option.interval}m`}
                                        </span>
                                    </div>
                                   
                                </Button>
                               
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Study;
