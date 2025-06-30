import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { QuizQuestion } from '@/types';


type QuizModalProps = {
    isOpen: boolean;
    onClose: () => void;
    questions: QuizQuestion[];
    onComplete?: (score: number) => void;
};

export function QuizModal({ isOpen, onClose, questions, onComplete }: QuizModalProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleOptionSelect = (optionId: string) => {
        if (isAnswered) return;
        setSelectedOptionId(optionId);
    };

    const handleSubmitAnswer = () => {
        if (!selectedOptionId || isAnswered) return;

        setIsAnswered(true);
        setShowExplanation(true);

        if (selectedOptionId === currentQuestion.correctOptionId) {
            setScore(score + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex === questions.length - 1) {
            onComplete?.(score);
            onClose();
            return;
        }

        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setShowExplanation(false);
    };

    const getOptionClassName = (optionId: string) => {
        if (!isAnswered) {
            return `border-2 ${selectedOptionId === optionId ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`;
        }

        if (optionId === currentQuestion.correctOptionId) {
            return 'border-2 border-green-500 bg-green-50';
        }

        if (optionId === selectedOptionId) {
            return 'border-2 border-red-500 bg-red-50';
        }

        return 'border-2 border-gray-200 opacity-50';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span className="text-indigo-600">Score: {score}/{currentQuestionIndex + 1}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mb-6">
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {currentQuestion.options.map((option) => (
                                <motion.div
                                    key={option.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${getOptionClassName(option.id)}`}
                                    onClick={() => handleOptionSelect(option.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.text}</span>
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                {option.id === currentQuestion.correctOptionId ? (
                                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                                ) : option.id === selectedOptionId ? (
                                                    <XCircleIcon className="w-6 h-6 text-red-500" />
                                                ) : null}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {showExplanation && currentQuestion.explanation && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                        >
                            <h3 className="font-semibold text-blue-800 mb-2">Explanation:</h3>
                            <p className="text-blue-700">{currentQuestion.explanation}</p>
                        </motion.div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        {!isAnswered ? (
                            <Button
                                onClick={handleSubmitAnswer}
                                disabled={!selectedOptionId}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                Submit Answer
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNextQuestion}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}