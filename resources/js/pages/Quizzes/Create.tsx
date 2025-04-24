import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import {AppShell} from '@/components/app-shell';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank';
  explanation?: string;
  options: QuizOption[];
  correctOptionId: string;
}

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
    questions: [] as QuizQuestion[],
  });

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      question: '',
      type: 'multiple-choice',
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '' },
        { id: Math.random().toString(36).substr(2, 9), text: '' },
      ],
      correctOptionId: '',
    };
    setData('questions', [...data.questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setData(
      'questions',
      data.questions.filter((q) => q.id !== questionId)
    );
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].options.push({
      id: Math.random().toString(36).substr(2, 9),
      text: '',
    });
    setData('questions', newQuestions);
  };

  const removeOption = (questionIndex: number, optionId: string) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].options = newQuestions[
      questionIndex
    ].options.filter((o) => o.id !== optionId);
    setData('questions', newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/quizzes');
  };

  return (
    <AppShell>
      <Head title="Create Quiz" />

      <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Quiz</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              id="title"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              className={`w-full rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <AnimatePresence>
          {data.questions.map((question, questionIndex) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Question {questionIndex + 1}</h2>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => {
                      const newQuestions = [...data.questions];
                      newQuestions[questionIndex].question = e.target.value;
                      setData('questions', newQuestions);
                    }}
                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => {
                      const newQuestions = [...data.questions];
                      newQuestions[questionIndex].type = e.target.value as QuizQuestion['type'];
                      setData('questions', newQuestions);
                    }}
                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="fill-in-blank">Fill in the Blank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  {question.options.map((option, optionIndex) => (
                    <div key={option.id} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option.text}
                        onChange={(e) => {
                          const newQuestions = [...data.questions];
                          newQuestions[questionIndex].options[optionIndex].text = e.target.value;
                          setData('questions', newQuestions);
                        }}
                        className="flex-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setData('questions', [
                            ...data.questions.slice(0, questionIndex),
                            {
                              ...question,
                              correctOptionId: option.id,
                            },
                            ...data.questions.slice(questionIndex + 1),
                          ])
                        }
                        className={`p-2 rounded-full transition-colors ${question.correctOptionId === option.id ? 'bg-primary-600 text-white hover:bg-primary-700' : 'text-primary-600 hover:bg-primary-50'}`}
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, option.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(questionIndex)}
                    className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <PlusIcon className="w-5 h-5 mr-1" />
                    Add Option
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (Optional)
                  </label>
                  <textarea
                    value={question.explanation || ''}
                    onChange={(e) => {
                      const newQuestions = [...data.questions];
                      newQuestions[questionIndex].explanation = e.target.value;
                      setData('questions', newQuestions);
                    }}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Question
          </button>
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Quiz
          </button>
        </div>
      </form>
    </AppShell>
  );
}