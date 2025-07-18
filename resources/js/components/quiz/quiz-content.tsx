import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import { toastConfig } from '@/lib/toast';
import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import { QuizQuestion } from '@/types';
import DOMPurify from 'dompurify';



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
        setIsFinished(false);
        setAnswers([]);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        let yOffset = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2); // Available width for text

        // Helper function to strip HTML tags
        const stripHtml = (html: string) => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        };

        // Add title
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0); // Black color for title
        doc.text('Quiz Summary', margin, yOffset);
        yOffset += 20;

        // Add quiz details
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Black color for details
        doc.text(`Total Questions: ${questions.length}`, margin, yOffset);
        yOffset += 20;

        // Add each question and its details
        questions.forEach((question, index) => {
            // Add question with text wrapping (strip HTML)
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0); // Black color for questions
            const questionText = `Question ${index + 1}: ${stripHtml(question.question)}`;
            const wrappedQuestion = doc.splitTextToSize(questionText, maxWidth);
            doc.text(wrappedQuestion, margin, yOffset);
            yOffset += wrappedQuestion.length * 7; // Adjust spacing based on number of lines
            yOffset += 5; // Extra spacing after question

            // Add options with text wrapping (strip HTML)
            doc.setFontSize(12);
            question.options.forEach((option) => {
                if (option.is_correct) {
                    // Set red color for correct answers
                    doc.setTextColor(255, 0, 0); // Red color (RGB: 255, 0, 0)
                    const optionText = `✓ ${stripHtml(option.text)} (CORRECT)`;
                    const wrappedOption = doc.splitTextToSize(optionText, maxWidth - 10); // Slightly less width for indentation
                    doc.text(wrappedOption, margin + 10, yOffset);
                    yOffset += wrappedOption.length * 6; // Adjust spacing based on number of lines
                } else {
                    // Set black color for incorrect answers
                    doc.setTextColor(0, 0, 0); // Black color
                    const optionText = `  ${stripHtml(option.text)}`;
                    const wrappedOption = doc.splitTextToSize(optionText, maxWidth - 10); // Slightly less width for indentation
                    doc.text(wrappedOption, margin + 10, yOffset);
                    yOffset += wrappedOption.length * 6; // Adjust spacing based on number of lines
                }
            });

            // Add explanation if available with text wrapping (strip HTML)
            if (question.explanation) {
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0); // Black color for explanations
                const explanationText = `Explanation: ${stripHtml(question.explanation)}`;
                const wrappedExplanation = doc.splitTextToSize(explanationText, maxWidth - 10);
                doc.text(wrappedExplanation, margin + 10, yOffset);
                yOffset += wrappedExplanation.length * 5; // Adjust spacing based on number of lines
                yOffset += 5; // Extra spacing after explanation
            }

            // Add spacing between questions
            yOffset += 10;

            // Check if we need a new page (with more conservative threshold)
            if (yOffset > 250) {
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
        const correctAnswers = score;
        const incorrectAnswers = questions.length - score;
        const halfCorrect = Math.floor(score / 2);
        const skipped = 0; // For future implementation
        
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

        // Calculate stroke dash array for donut chart
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

        return (
            <div className="max-w-4xl mx-auto text-center space-y-8 py-8 sm:py-12 px-4">
                {/* Header with emoji and title */}
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{message}</h2>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {t('quiz_score_message', { score, total: questions.length, percentage })}
                    </p>
                </div>

                {/* Donut Chart */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="transparent"
                                className="dark:stroke-gray-700"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="#10b981"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={strokeDasharray}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        {/* Percentage in center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {percentage}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="flex justify-center mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                        {/* Total Questions */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-700/30 text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                                {questions.length}
                            </div>
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Total Questions
                            </div>
                        </div>

                        {/* Correct Answers */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 shadow-sm border border-green-200 dark:border-green-700/30 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <div className="text-3xl sm:text-4xl font-bold text-green-700 dark:text-green-300">
                                    {correctAnswers}
                                </div>
                                <div className="w-3 h-3 bg-green-500 rounded-full ml-2"></div>
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                Correct • {Math.round((correctAnswers / questions.length) * 100)}%
                            </div>
                        </div>

                        {/* Incorrect Answers */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-700/30 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <div className="text-3xl sm:text-4xl font-bold text-red-700 dark:text-red-300">
                                    {incorrectAnswers}
                                </div>
                                <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
                            </div>
                            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                                Incorrect • {Math.round((incorrectAnswers / questions.length) * 100)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Encouraging Message */}
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {encouragingMessage}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3"
                    >
                        <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        {t('quiz_restart')}
                    </Button>
                    <Button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
                        asChild
                        variant={'outline'}
                    >
                        <Link href="/quizzes">
                            {t('back_to_quizzes')}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-4">
            {/* Header Section */}
            <div className="space-y-3 sm:space-y-4">
                {/* Question Counter and Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <span className="text-sm sm:text-base font-medium">
                        {t('quiz_question_of', { current: currentQuestionIndex + 1, total: questions.length })}
                    </span>
                    {/* <span className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-medium">
                        {t('quiz_score_of', { current: score, total: currentQuestionIndex + 1 })}
                    </span> */}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShuffle}
                        disabled={isAnswered}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                        <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t('quiz_shuffle')}</span>
                        <span className="sm:hidden">Shuffle</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                        <DocumentArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t('quiz_export_pdf')}</span>
                        <span className="sm:hidden">PDF</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-yellow-600 hover:text-yellow-700"
                    >
                        <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t('quiz_reset')}</span>
                        <span className="sm:hidden">Reset</span>
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 sm:mb-6">
                <Progress value={progress} className="h-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" />
            </div>

            {/* Quiz Content */}
            <div className="space-y-4 sm:space-y-6">
                <h2 
                    className="text-lg sm:text-xl font-semibold leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(currentQuestion.question) 
                    }}
                />

                <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence>
                        {currentQuestion.options.map((option) => (
                            <motion.div
                                key={option.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 ${getOptionClassName(option.id)}`}
                                onClick={() => handleOptionSelect(option.id)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span 
                                        className="text-sm sm:text-base leading-relaxed flex-1"
                                        dangerouslySetInnerHTML={{ 
                                            __html: DOMPurify.sanitize(option.text) 
                                        }}
                                    />
                                    {isAnswered && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="flex-shrink-0"
                                        >
                                            {option.is_correct ? (
                                                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                            ) : option.id === selectedOptionId ? (
                                                <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
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
                        className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm sm:text-base">
                            {t('quiz_explanation')}:
                        </h3>
                        <div 
                            className="text-blue-700 dark:text-blue-200 text-sm sm:text-base leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(currentQuestion.explanation) 
                            }}
                        />
                    </motion.div>
                )}

                {/* Action Button */}
                <div className="flex justify-end mt-4 sm:mt-6">
                    {!isAnswered ? (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedOptionId}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {t('quiz_submit_answer')}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNextQuestion}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {currentQuestionIndex === questions.length - 1 ? t('quiz_finish') : t('quiz_next_question')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}