import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, MoreVertical, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppLayout from '@/layouts/app-layout';

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
  const [hoveredQuiz, setHoveredQuiz] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setSelectedQuizId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedQuizId) return;

    router.delete(`/quizzes/${selectedQuizId}`, {
      onSuccess: () => {
        toast.success('Quiz deleted successfully.');
        setDeleteDialogOpen(false);
      },
      onError: (error) => {
        toast.error('There was an error deleting the quiz!');
        console.error('There was an error deleting the quiz!', error);
        setDeleteDialogOpen(false);
      }
    });
  };

  return (
    <AppLayout>
      <Head title="Quizzes" />
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">My Quizzes</h1>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/quizzes/${quiz.id}`}>
                            View Quiz
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/quizzes/${quiz.id}/edit`}>
                            Edit Quiz
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(quiz.id)}>
                          Delete Quiz
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
                    <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/quizzes/${quiz.id}`} className="flex items-center gap-2">
                        Take Quiz
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
              No quizzes yet
            </h3>
            <p className="text-neutral-500 mt-2">
              Generate your first quiz to start testing your knowledge
            </p>
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? This action cannot be undone."
      />
    </AppLayout>
  );
}