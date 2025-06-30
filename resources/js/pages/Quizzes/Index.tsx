import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, MoreVertical, ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { CreateQuizModal } from '@/components/quiz/create-quiz-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

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
  thumbnail_color?: string;
  thumbnail_url?: string;
}

interface Props {
  quizzes: {
    data: Quiz[];
    links: any;
    meta: any;
  };
  isLoading?: boolean;
}

export default function Index({ quizzes, isLoading = false }: Props) {
  const { t } = useTranslation(['translation']);
  const [hoveredQuiz, setHoveredQuiz] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedQuizId(id);
    setDeleteDialogOpen(true);
  };

  const getThumbnailStyle = (quiz: Quiz) => {
    if (quiz.thumbnail_url) {
      return {
        backgroundImage: `url(${quiz.thumbnail_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundColor: quiz.thumbnail_color || '#3B82F6',
    };
  };

  return (
    <AppLayout>
      <Head title={t('Quizzes')} />
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t('My Quizzes')}</h1>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('Create Quiz')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))
          ) : (
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
                      <div 
                        className="p-2 rounded-lg flex items-center justify-center"
                        style={getThumbnailStyle(quiz)}
                      >
                        {!quiz.thumbnail_url && (
                          <ClipboardList className="h-5 w-5 text-white" />
                        )}
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
                        <DropdownMenuItem className="" asChild>
                          <Link href={'/quizzes/' + quiz.id + '/edit'}>
                            {t('edit')}
                          </Link>
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
                    <Button variant="outline" size="default" asChild className='dark:text-white w-full dark:border-1 dark:hover:border-gray-300'>
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
          )}
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

      {/* Create Quiz Modal */}
      <CreateQuizModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />

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