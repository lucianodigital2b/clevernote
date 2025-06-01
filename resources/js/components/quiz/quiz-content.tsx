import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import { toastConfig } from '@/lib/toast';
import { useTranslation } from 'react-i18next';

type QuizOption = {
    id: string;
    text: string;
    is_correct: boolean;
};

type QuizQuestion = {
    id: string;
    question: string;
    options: QuizOption[];
    explanation?: string;
};

type QuizOptionWithCorrect = QuizOption & {
    is_correct: boolean;
};

type QuizContentProps = {
    title: string;
    questions: QuizQuestion[];
    onComplete?: (score: number, answers: Array<{ question_id: string; option_id: string }>) => void;
};

export function QuizContent({ title, questions, onComplete }: QuizContentProps) {
    const { t } = useTranslation();
    const handleReset = () => {
        setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
        setCurrentQuestionIndex(0);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setShowExplanation(false);
        setScore(0);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        let yOffset = 20;

        // Add title
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0); // Black color for title
        doc.text('Quiz Summary', 20, yOffset);
        yOffset += 20;

        // Add quiz details
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Black color for details
        doc.text(`Total Questions: ${questions.length}`, 20, yOffset);
        yOffset += 20;

        // Add each question and its details
        questions.forEach((question, index) => {
            // Add question
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0); // Black color for questions
            doc.text(`Question ${index + 1}: ${question.question}`, 20, yOffset);
            yOffset += 10;

            // Add options
            doc.setFontSize(12);
            question.options.forEach((option) => {
                if (option.is_correct) {
                    // Set red color for correct answers
                    doc.setTextColor(255, 0, 0); // Red color (RGB: 255, 0, 0)
                    const optionText = `${option.text} (CORRECT)`;
                    doc.text(optionText, 30, yOffset);
                } else {
                    // Set black color for incorrect answers
                    doc.setTextColor(0, 0, 0); // Black color
                    const optionText = `  ${option.text}`;
                    doc.text(optionText, 30, yOffset);
                }
                yOffset += 8;
            });

            // Add explanation if available
            if (question.explanation) {
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0); // Black color for explanations
                doc.text(`Explanation: ${question.explanation}`, 30, yOffset);
                yOffset += 15;
            }

            // Add spacing between questions
            yOffset += 10;

            // Check if we need a new page
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 20;
            }
        });

        // Save the PDF
        doc.save('quiz-summary.pdf');
    };
    const [shuffledQuestions, setShuffledQuestions] = useState(() => [...questions].sort(() => Math.random() - 0.5));

    const handleShuffle = () => {
        if (isAnswered) return;
        setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
        setCurrentQuestionIndex(0);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setShowExplanation(false);
        setScore(0);
    };
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [answers, setAnswers] = useState<Array<{ question_id: string; option_id: string }>>([]);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleOptionSelect = (optionId: string) => {
        if (isAnswered) return;
        setSelectedOptionId(optionId);
    };

    const handleSubmitAnswer = () => {
        if (!selectedOptionId || isAnswered) return;

        setIsAnswered(true);
        setShowExplanation(true);

        const selectedOption = currentQuestion.options.find(option => option.id === selectedOptionId);
        if (selectedOption?.is_correct) {
            setScore(score + 1);
        }

        setAnswers([...answers, {
            question_id: currentQuestion.id,
            option_id: selectedOptionId
        }]);
    };

    const [isFinished, setIsFinished] = useState(false);

    const handleNextQuestion = () => {
        if (currentQuestionIndex === questions.length - 1) {
            onComplete?.(score, answers);
            setIsFinished(true);
            return;
        }

        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setShowExplanation(false);
    };

    const getOptionClassName = (optionId: string) => {
        if (!isAnswered) {
            return `border-2 ${selectedOptionId === optionId ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-600'}`;
        }

        const option = currentQuestion.options.find(opt => opt.id === optionId);
        if (option?.is_correct) {
            return 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20';
        }

        if (optionId === selectedOptionId) {
            return 'border-2 border-red-500 bg-red-50 dark:bg-red-900/20';
        }

        return 'border-2 border-gray-200 dark:border-neutral-700 opacity-50';
    };

    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        let message = t('quiz_congratulations');
        let encouragingMessage = '';
        
        if (percentage >= 90) {
            encouragingMessage = t('quiz_excellent_message');
        } else if (percentage >= 70) {
            encouragingMessage = t('quiz_great_message');
        } else if (percentage >= 50) {
            encouragingMessage = t('quiz_good_message');
        } else {
            encouragingMessage = t('quiz_keep_practicing_message');
        }

        return (
            <div className="max-w-3xl mx-auto text-center space-y-8 py-12">
                <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{message}</h2>
                <div className="text-xl">
                    {t('quiz_score_message', { score, total: questions.length, percentage })}
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">{encouragingMessage}</p>
                <div className="flex justify-center gap-4 mt-8">
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        {t('quiz_restart')}
                    </Button>
                    <Button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                        {t('back_to_quizzes')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <span>{t('quiz_question_of', { current: currentQuestionIndex + 1, total: questions.length })}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShuffle}
                        disabled={isAnswered}
                        className="flex items-center gap-2"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        {t('quiz_shuffle')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        className="flex items-center gap-2"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        {t('quiz_export_pdf')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        {t('quiz_reset')}
                    </Button>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400">{t('quiz_score_of', { current: score, total: currentQuestionIndex + 1 })}</span>
            </div>

            <div className="mb-6">
                <Progress value={progress} className="h-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" />
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
                                            {option.is_correct ? (
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
                        className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">{t('quiz_explanation')}:</h3>
                        <p className="text-blue-700 dark:text-blue-200">{currentQuestion.explanation}</p>
                    </motion.div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    {!isAnswered ? (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedOptionId}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {t('quiz_submit_answer')}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNextQuestion}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {currentQuestionIndex === questions.length - 1 ? t('quiz_finish') : t('quiz_next_question')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}