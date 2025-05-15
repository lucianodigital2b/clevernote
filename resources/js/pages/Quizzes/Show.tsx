import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QuizContent } from '@/components/quiz/quiz-content';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';
import axios from 'axios';
import { Quiz } from '@/types';





interface Props {
    quiz: Quiz;
}

export default function Show({ quiz }: Props) {
    const [isQuizStarted, setIsQuizStarted] = useState(false);

    const handleQuizComplete = async (score: number, selectedAnswers: Array<{ question_id: string; option_id: string }>) => {
        try {
            const response = await axios.post(`/quizzes/${quiz.id}/attempt`, {
                answers: selectedAnswers
            });

            toast.success(`Quiz completed! Score: ${score}/${quiz.questions.length}`);
        } catch (error) {
            console.error('Error saving quiz attempt:', error);
            toast.error('Failed to save quiz attempt');
        }
    };

    return (
        <AppLayout>
            <Head title={quiz.title} />

            <div className="container mx-auto py-6 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
                        
                        {quiz.description && (
                            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                                {quiz.description}
                            </p>
                        )}

                        {quiz.note && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    This quiz is based on your note:{' '}
                                    <a
                                        href={`/notes/${quiz.note.id}`}
                                        className="font-medium hover:underline"
                                    >
                                        {quiz.note.title}
                                    </a>
                                </p>
                            </div>
                        )}

                        {!isQuizStarted ? (
                            <div className="flex flex-col items-center justify-center space-y-4 mt-8">
                                <div className="text-center mb-4">
                                    <p className="text-lg mb-2">
                                        {quiz.questions.length} questions
                                    </p>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        Test your knowledge and track your progress
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => setIsQuizStarted(true)}
                                    className="w-full max-w-sm"
                                >
                                    Start Quiz
                                </Button>
                            </div>
                        ) : (
                            <QuizContent
                                title={quiz.title}
                                questions={quiz.questions}
                                onComplete={handleQuizComplete}
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}