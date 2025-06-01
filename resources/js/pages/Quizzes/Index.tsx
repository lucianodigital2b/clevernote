import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, MoreVertical, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from 'react-i18next';

interface QuizOption {
  id: number;
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  type: string;
  explanation?: string;
  options: QuizOption[];
}

interface Quiz {
  id: number;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  created_at: string;
}

interface Props {
  quizzes: {
    data: Quiz[];
    links: any;
    meta: any;
  };
}

export default function Index({ quizzes }: Props) {
  const { t } = useTranslation(['translation']);
  const [hoveredQuiz, setHoveredQuiz] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setSelectedQuizId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <AppLayout>
      <Head title={t('Quizzes')} />
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t('My Quizzes')}</h1>
          {/* <Button asChild>
            <Link href="/quizzes/create">
              Create Quiz
            </Link>
          </Button> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <AnimatePresence>
            {quizzes.data.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                onHoverStart={() => setHoveredQuiz(quiz.id)}
                onHoverEnd={() => setHoveredQuiz(null)}
              >
                <div 
                  className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 
                           hover:shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <ClipboardList className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{quiz.title}</h3>
                        <p className="text-sm text-neutral-500">
                          {quiz.questions.length} questions
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(quiz.id)}>
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {quiz.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-sm text-neutral-500">
                    <span>{t('Created')} {new Date(quiz.created_at).toLocaleDateString()}</span>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/quizzes/${quiz.id}`} className="flex items-center gap-2">
                        {t('Take Quiz')}
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {quizzes.data.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {t('No quizzes yet')}
            </h3>
            <p className="text-neutral-500 mt-2">
              {t('Generate your first quiz')}
            </p>
          </div>
        )}
      </div>

      {selectedQuizId && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          endpoint={`/quizzes/${selectedQuizId}`}
          title={t('are_you_sure')}
          description={t('this_action_cannot_be_undone')}
          successMessage={t('deleted_successfully')}
          errorMessage={t('delete_error')}
        />
      )}
    </AppLayout>
  );
}