import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CheckIcon, QueueListIcon, CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { toastConfig } from '@/lib/toast';
import { TiptapEditor } from '@/components/ui/tiptap-editor';

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
  const { t } = useTranslation();
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
    is_published: false,
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

  const updateQuestion = (questionIndex: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value };
    setData('questions', newQuestions);
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
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (o) => o.id !== optionId
    );
    setData('questions', newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].options[optionIndex].text = text;
    setData('questions', newQuestions);
  };

  const setCorrectOption = (questionIndex: number, optionId: string) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].correctOptionId = optionId;
    setData('questions', newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all questions have correct answers selected
    const invalidQuestions = data.questions.filter(q => !q.correctOptionId || !q.question.trim());
    if (invalidQuestions.length > 0) {
        toast.error(t('Please complete all questions and select correct answers'));
        return;
    }

    post('/quizzes', {
        onSuccess: () => {
            toastConfig.success(t('Quiz created successfully!'));
        },
        onError: (errors) => {
            if (errors.general) {
                toastConfig.error(errors.general);
            } else {
                toastConfig.error(t('Failed to create quiz. Please try again.'));
            }
        }
    });
};

  return (
    <AppLayout>
      <Head title={t('Create Quiz')} />

      <div className="container mx-auto py-6 px-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
         
          
          <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{t('Create New Quiz')}</h1>
              <Button type="submit" disabled={processing || data.questions.length === 0}>
                  {processing ? t('Creating...') : t('Create Quiz')}
              </Button>
          </div>

          {/* Quiz Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Quiz Details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">{t('Quiz Title')}</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                  placeholder={t('Enter quiz title...')}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">{t('Description (Optional)')}</Label>
                <TiptapEditor
                  content={data.description}
                  onUpdate={(content) => setData('description', content)}
                  mediaCollection="quiz-description-images"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={data.is_published}
                  onCheckedChange={(checked) => setData('is_published', checked)}
                />
                <Label htmlFor="published">{t('Publish immediately')}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{t('Questions')}</h2>
              <Button type="button" variant="outline" onClick={addQuestion}>
                <PlusIcon className="w-4 h-4 mr-2" />
                {t('Add Question')}
              </Button>
            </div>

            {data.questions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t('No questions added yet. Click "Add Question" to get started.')}</p>
                </CardContent>
              </Card>
            )}

            <AnimatePresence>
              {data.questions.map((question, questionIndex) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          {t('Question')} {questionIndex + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>{t('Question Text')}</Label>
                        <TiptapEditor
                          content={question.question}
                          onUpdate={(content) => {
                            const newQuestions = [...data.questions];
                            newQuestions[questionIndex].question = content;
                            setData('questions', newQuestions);
                          }}
                          mediaCollection="quiz-question-images"
                        />
                      </div>

                      <div>
                        <Label className="mb-3 block">{t('Question Type')}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div
                            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                              question.type === 'multiple-choice'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => updateQuestion(questionIndex, 'type', 'multiple-choice')}
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <QueueListIcon className={`w-8 h-8 ${
                                question.type === 'multiple-choice'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                              <div>
                                <h3 className={`font-medium text-sm ${
                                  question.type === 'multiple-choice'
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {t('Multiple Choice')}
                                </h3>
                                <p className={`text-xs mt-1 ${
                                  question.type === 'multiple-choice'
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  Select from options
                                </p>
                              </div>
                            </div>
                            {question.type === 'multiple-choice' && (
                              <CheckIcon className="absolute top-2 right-2 w-5 h-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>

                          <div
                            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                              question.type === 'true-false'
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => updateQuestion(questionIndex, 'type', 'true-false')}
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <CheckCircleIcon className={`w-8 h-8 ${
                                question.type === 'true-false'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                              <div>
                                <h3 className={`font-medium text-sm ${
                                  question.type === 'true-false'
                                    ? 'text-green-900 dark:text-green-100'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {t('True/False')}
                                </h3>
                                <p className={`text-xs mt-1 ${
                                  question.type === 'true-false'
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  Yes or no answer
                                </p>
                              </div>
                            </div>
                            {question.type === 'true-false' && (
                              <CheckIcon className="absolute top-2 right-2 w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>

                          <div
                            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                              question.type === 'fill-in-blank'
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => updateQuestion(questionIndex, 'type', 'fill-in-blank')}
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <PencilSquareIcon className={`w-8 h-8 ${
                                question.type === 'fill-in-blank'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                              <div>
                                <h3 className={`font-medium text-sm ${
                                  question.type === 'fill-in-blank'
                                    ? 'text-purple-900 dark:text-purple-100'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {t('Fill in the Blank')}
                                </h3>
                                <p className={`text-xs mt-1 ${
                                  question.type === 'fill-in-blank'
                                    ? 'text-purple-700 dark:text-purple-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  Type the answer
                                </p>
                              </div>
                            </div>
                            {question.type === 'fill-in-blank' && (
                              <CheckIcon className="absolute top-2 right-2 w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>{t('Answer Options')}</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(questionIndex)}
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            {t('Add Option')}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className="flex gap-2 items-center">
                              <Input
                                value={option.text}
                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`${t('Option')} ${optionIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant={question.correctOptionId === option.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCorrectOption(questionIndex, option.id)}
                                className={question.correctOptionId === option.id ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                <CheckIcon className="w-4 h-4" />
                              </Button>
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(questionIndex, option.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>{t('Explanation (Optional)')}</Label>
                        <Textarea
                          value={question.explanation || ''}
                          onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                          placeholder={t('Explain why this is the correct answer...')}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}