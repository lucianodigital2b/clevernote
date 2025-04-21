import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RotateCw, SendHorizonal } from 'lucide-react';
import { FlashcardSet } from '@/types';
import { Progress } from "@/components/ui/progress";
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
    const [progress, setProgress] = useState<FlashcardProgress[]>([]);
    const [dueIndexes, setDueIndexes] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Initialize progress and dueIndexes
    useEffect(() => {
        const initialProgress = flashcardSet.flashcards.map(flashcard => ({
            id: flashcard.id,
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

    // Helper to get the next due card index
    const getNextDueIndex = (excludeIndex?: number) => {
        const now = new Date();
        const filtered = dueIndexes.filter(idx => {
            if (excludeIndex !== undefined && idx === excludeIndex) return false;
            const prog = progress[idx];
            return prog && prog.nextReview <= now;
        });
        return filtered.length > 0 ? filtered[0] : null;
    };

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
    }, [progress]);

    const currentFlashcard = currentIndex !== null ? flashcardSet.flashcards[currentIndex] : null;
    const currentProgress = currentIndex !== null ? progress[currentIndex] : null;

    const handleNext = () => {
        const nextIdx = getNextDueIndex(currentIndex ?? undefined);
        if (nextIdx === null) {
            setCurrentIndex(null);
            setIsComplete(true);
        } else {
            setCurrentIndex(nextIdx);
            setIsFlipped(false);
        }
    };

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

    const recallOptions: RecallOption[] = [
        { label: 'Again', interval: 1, quality: 0 }, // 1 minute
        { label: 'Hard', interval: 6, quality: 2 }, // 6 minutes
        { label: 'Good', interval: 10, quality: 3 }, // 10 minutes
        { label: 'Easy', interval: 5760, quality: 5 }, // 4 days (in minutes)
    ];

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

        await axios.post(`/flashcard-sets/${flashcardSet.id}/progress`, {
            flashcard_id: currentFlashcard!.id,
            interval: option.interval,
            repetition: newProgress[currentIndex].repetition,
            efactor: currentProgress.efactor,
            next_review: new Date(nextReviewTime).toISOString()
        });

        setProgress(newProgress);
        // After updating progress, useEffect will update dueIndexes and currentIndex
    };

    const studyProgress = dueIndexes.length === 0
        ? 100
        : ((flashcardSet.flashcards.length - dueIndexes.length) / flashcardSet.flashcards.length) * 100;

    // Feedback input state (optional, for send icon)
    const [feedback, setFeedback] = useState('');

    if (isComplete) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-xl border shadow-lg p-8 flex flex-col items-center max-w-md w-full">
                        <div className="text-2xl font-semibold mb-2 flex items-center gap-2">
                            Well done! <span role="img" aria-label="bee">🐝</span>
                        </div>
                        <div className="mb-6 text-gray-500 text-center">
                            Your learning experience does not stop here <span role="img" aria-label="point">👈</span>
                        </div>
                        <div className="flex gap-2 w-full mb-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    // Restart session: all cards due again
                                    const allIndexes = flashcardSet.flashcards.map((_, idx) => idx);
                                    setDueIndexes(allIndexes);
                                    setCurrentIndex(allIndexes.length > 0 ? allIndexes[0] : null);
                                    setIsFlipped(false);
                                    setIsComplete(false);
                                }}
                            >
                                <RotateCw className="h-4 w-4 mr-2" />
                                Review All
                            </Button>
                        </div>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Leave us a feedback!"
                                className="w-full border rounded px-3 py-2 text-sm pr-10"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
                                tabIndex={-1}
                                // onClick={() => { /* handle feedback send */ }}
                            >
                                <SendHorizonal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (currentIndex === null || !currentFlashcard) {
        // No cards due
        return null;
    }

    return (
        <AppLayout>
            <Head title={`Study ${flashcardSet.name}`} />

            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="outline" asChild>
                        <Link href={`/flashcard-sets/${flashcardSet.id}`} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Set
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold">Studying: {flashcardSet.name}</h1>
                </div>

                <div className="max-w-2xl mx-auto">
                    <Progress value={studyProgress} className="mb-6" />
                    <div 
                        className="relative min-h-[400px] perspective-1000"
                        onClick={handleFlip}
                    >
                        <div className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front Side */}
                            <Card className={`absolute w-full h-full backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                                <CardHeader className="flex-none">
                                    <CardTitle className="text-center">
                                        Flashcard {currentIndex + 1} of {flashcardSet.flashcards.length}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                                    <div className="text-center text-xl">
                                        {currentFlashcard.question}
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Back Side */}
                            <Card className={`absolute w-full h-full backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                                <CardHeader className="flex-none">
                                    <CardTitle className="text-center">
                                        Flashcard {currentIndex + 1} of {flashcardSet.flashcards.length}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                                    <div className="text-center text-xl">
                                        {currentFlashcard.answer}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={handlePrevious}
                            disabled={
                                dueIndexes.length === 0 ||
                                currentIndex === null ||
                                dueIndexes.indexOf(currentIndex) === 0
                            }
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleFlip}
                        >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Flip Card
                        </Button>
                    </div>
                    {/* Recall options are now always visible */}
                    <div className="flex justify-center gap-4 mt-6">
                        {recallOptions.map((option) => (
                            <Button
                                key={option.label}
                                variant={
                                    option.label === 'Again' ? 'destructive' : 
                                    option.label === 'Easy' ? 'default' : 
                                    'outline'
                                }
                                onClick={() => handleRecall(option)}
                                className={
                                    `min-w-[80px] py-4 px-6` +
                                    (option.label === 'Easy'
                                        ? ' bg-green-500 text-white hover:bg-green-600'
                                        : '')
                                }
                            >
                                <div className="flex flex-col items-center">
                                    <span>{option.label}</span>
                                    <span className="text-xs opacity-70">
                                        {option.interval >= 1440 
                                            ? `${Math.floor(option.interval / 1440)}d` 
                                            : option.interval >= 60 
                                                ? `${Math.floor(option.interval / 60)}h` 
                                                : `${option.interval}m`}
                                    </span>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Study;
