import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import AppShell from '@/components/app-shell';

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

  return (
    <AppShell>
      <Head title="Quizzes" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Quizzes</h1>
          <Link href="/quizzes/create">
            <button
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Quiz
            </button>
          </Link>
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
                  className={`bg-white rounded-lg shadow-md p-6 h-full transition-all duration-300 ${hoveredQuiz === quiz.id ? 'transform -translate-y-1 shadow-lg' : ''}`}
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
                    {quiz.description && (
                      <p className="text-gray-600 mb-2">{quiz.description}</p>
                    )}
                    <p className="text-gray-600">{quiz.questions.length} questions</p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link href={`/quizzes/${quiz.id}/edit`}>
                      <button
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                        title="Edit Quiz"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </Link>
                    <Link
                      href={`/quizzes/${quiz.id}`}
                      method="delete"
                      as="button"
                      type="button"
                    >
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Quiz"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}