import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QuizContent } from '@/components/quiz/quiz-content';
import { XPNotification } from '@/components/xp-notification';
import { toast } from 'sonner';
import axios from 'axios';
import { Quiz } from '@/types';

interface XPReward {
    success: boolean;
    xp_gained: number;
    total_xp: number;
    old_level: number;
    new_level: number;
    leveled_up: boolean;
}

interface QuizTabProps {
    quiz: Quiz;
    className?: string;
}

export function QuizTab({ quiz, className = '' }: QuizTabProps) {
    const { t } = useTranslation();
    const [isQuizStarted, setIsQuizStarted] = useState(false);
    const [xpReward, setXpReward] = useState<XPReward | null>(null);

    const handleQuizComplete = async (score: number, selectedAnswers: Array<{ question_id: string; option_id: string }>) => {
        try {
            const response = await axios.post(`/quizzes/${quiz.id}/attempt`, {
                answers: selectedAnswers
            });

            // Handle XP reward if present in response
            if (response.data.xp_reward) {
                setXpReward(response.data.xp_reward);
            }

        } catch (error) {
            console.error('Error saving quiz attempt:', error);
            toast.error(t('quiz_save_error'));
        }
    };

    const handleXPNotificationClose = () => {
        setXpReward(null);
    };

    return (
        <div className={`h-full flex flex-col ${className}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 p-4 sm:p-6"
            >
                <div className="max-w-3xl mx-auto text-center h-full flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">{quiz.title}</h2>
                    
                    {quiz.description && (
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm sm:text-base">
                            {quiz.description}
                        </p>
                    )}

                    {quiz.note && (
                        <div className="mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                                {t('quiz_based_on_note')}{' '}
                                <a
                                    href={`/notes/${quiz.note.id}`}
                                    className="font-medium hover:underline break-words"
                                >
                                    {quiz.note.title}
                                </a>
                            </p>
                        </div>
                    )}

                    {!isQuizStarted ? (
                        <div className="flex flex-col items-center justify-center space-y-4 flex-1">
                            <div className="text-center mb-4">
                                <p className="text-base sm:text-lg mb-2">
                                    {t('quiz_questions_count', { count: quiz.questions?.length || 0 })}
                                </p>
                                <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
                                    {t('quiz_test_knowledge')}
                                </p>
                            </div>

                            <Button
                                size="lg"
                                onClick={() => setIsQuizStarted(true)}
                                className="w-full max-w-sm"
                            >
                                {t('quiz_start')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1">
                            <QuizContent
                                title={quiz.title}
                                questions={quiz.questions || []}
                                onComplete={handleQuizComplete}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* XP Notification */}
            <XPNotification 
                xpReward={xpReward} 
                onClose={handleXPNotificationClose}
            />
        </div>
    );
}