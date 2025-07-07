import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizContent } from '@/components/quiz/quiz-content';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toastConfig } from '@/lib/toast';
import { Trophy, Users, Clock } from 'lucide-react';

interface QuizOption {
  id: number;
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  explanation?: string;
  options: QuizOption[];
}

interface Quiz {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  is_published: boolean;
  questions: QuizQuestion[];
}

interface LeaderboardEntry {
  id: number;
  user: {
    name: string;
  };
  best_score: number;
  attempts_count: number;
}

interface Props {
  quiz: Quiz;
  canAttempt: boolean;
  leaderboard: LeaderboardEntry[];
  nextAttemptAt?: string;
}

export default function Public({ quiz, canAttempt, leaderboard, nextAttemptAt }: Props) {
  const { t } = useTranslation();
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuizComplete = async (score: number, selectedAnswers: Array<{ question_id: string; option_id: string }>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`/quizzes/${quiz.uuid}/public/attempt`, {
        answers: selectedAnswers.map(answer => ({
          question_id: parseInt(answer.question_id),
          option_id: parseInt(answer.option_id)
        }))
      });

      const { score: finalScore, total, percentage } = response.data;
      
      toastConfig.success(`Quiz completed! Score: ${finalScore}/${total} (${percentage.toFixed(1)}%)`);
      
      // Refresh the page to show updated leaderboard
      window.location.reload();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toastConfig.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isQuizStarted) {
    return (
      <>
        <Head title={`${quiz.title} - Public Quiz`} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <QuizContent
                        title={quiz.title}
                        questions={quiz.questions}
                        onComplete={handleQuizComplete}
                    />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title={`${quiz.title} - Public Quiz`} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Quiz Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold">{quiz.title}</CardTitle>
                    {quiz.description && (
                      <CardDescription className="mt-2 text-lg">
                        <div dangerouslySetInnerHTML={{ __html: quiz.description }} />
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {quiz.questions.length} {quiz.questions.length === 1 ? 'Question' : 'Questions'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>~{Math.ceil(quiz.questions.length * 1.5)} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{leaderboard.length} attempts</span>
                  </div>
                </div>
                
                {canAttempt ? (
                  <Button 
                    onClick={() => setIsQuizStarted(true)}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Start Quiz
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      You need to wait before taking this quiz again.
                    </p>
                    {nextAttemptAt && (
                      <p className="text-sm text-gray-500">
                        Next attempt available: {new Date(nextAttemptAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{entry.user.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.best_score} points</div>
                          <div className="text-sm text-gray-500">
                            {entry.attempts_count} {entry.attempts_count === 1 ? 'attempt' : 'attempts'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}