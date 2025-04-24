import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

interface Props {
  quiz: {
    id: number;
    title: string;
    description: string;
    is_published: boolean;
    questions: QuizQuestion[];
  };
}

export default function Edit({ quiz }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    title: quiz.title,
    description: quiz.description || '',
    is_published: quiz.is_published,
    questions: quiz.questions.map(q => ({
      ...q,
      options: q.options.map(o => ({
        ...o,
        id: o.id.toString()
      }))
    })),
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
    put(`/quizzes/${quiz.id}`);
  };

  return (
    <AppShell>
      <Head title="Edit Quiz" />

      <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Quiz</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={data.is_published}
                onCheckedChange={(checked) => setData('is_published', checked)}
              />
              <Label htmlFor="published">Published</Label>
            </div>
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
            >
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Question {questionIndex + 1}</h2>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Question Text</Label>
                    <Input
                      value={question.question}
                      onChange={(e) => {
                        const newQuestions = [...data.questions];
                        newQuestions[questionIndex].question = e.target.value;
                        setData('questions', newQuestions);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => {
                        const newQuestions = [...data.questions];
                        newQuestions[questionIndex].type = value as QuizQuestion['type'];
                        setData('questions', newQuestions);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="true-false">True/False</SelectItem>
                        <SelectItem value="fill-in-blank">Fill in the Blank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2">Options</Label>
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex gap-2 mb-2"
                      >
                        <Input
                          placeholder={`Option ${optionIndex + 1}`}
                          value={option.text}
                          onChange={(e) => {
                            const newQuestions = [...data.questions];
                            newQuestions[questionIndex].options[optionIndex].text =
                              e.target.value;
                            setData('questions', newQuestions);
                          }}
                          className="flex-1"
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
                          className={`p-2 rounded-full transition-colors ${question.correctOptionId === option.id
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'text-primary hover:bg-primary/10'}`}
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(questionIndex, option.id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOption(questionIndex)}
                      className="mt-2"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  <div>
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(e) => {
                        const newQuestions = [...data.questions];
                        newQuestions[questionIndex].explanation = e.target.value;
                        setData('questions', newQuestions);
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Question
          </Button>
          <Button
            type="submit"
            disabled={processing}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </AppShell>
  );
}