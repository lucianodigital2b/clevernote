import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import axios from 'axios';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { toastConfig } from '@/lib/toast';
import { Bold as BoldIcon, Italic as ItalicIcon, ImageIcon, GripVertical } from 'lucide-react';
import { QuizQuestion, QuizOption } from '@/types/quiz';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';



interface Props {
  quiz: {
    id: number;
    title: string;
    description: string;
    is_published: boolean;
    questions: QuizQuestion[];
  };
}

// Sortable Option Component
function SortableOption({ option, questionIndex, optionIndex, question, optionEditorsRefs, isUploadingImage, uploadingEditor, uploadImage, removeOption, errors }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 mb-2 group ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex-1">
        <div className={`border rounded-md ${
          errors && errors[`questions.${questionIndex}.options.${optionIndex}.text`] 
            ? 'border-red-500' : ''
        }`}>
          <div className="border-b p-2 flex gap-2 flex-wrap ">
              <button
                type="button"
                onClick={() => optionEditorsRefs[questionIndex]?.[optionIndex]?.chain().focus().toggleBold().run()}
                className={`p-2 rounded text-sm dark:bg-transparent cursor-pointer ${
                  optionEditorsRefs[questionIndex]?.[optionIndex]?.isActive('bold') ? 'bg-blue-300 text-white' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title="Bold"
              >
                <BoldIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => optionEditorsRefs[questionIndex]?.[optionIndex]?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded text-sm dark:bg-transparent cursor-pointer ${
                  optionEditorsRefs[questionIndex]?.[optionIndex]?.isActive('italic') ? 'bg-blue-300 text-white' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title="Italic"
              >
                <ItalicIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => optionEditorsRefs[questionIndex]?.[optionIndex]?.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded text-sm dark:bg-transparent cursor-pointer ${
                  optionEditorsRefs[questionIndex]?.[optionIndex]?.isActive('highlight') ? 'bg-blue-300 text-white' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title="Highlight"
              >
                <span className="w-4 h-4 bg-purple-200 rounded px-1">H</span>
              </button>
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadImage(file, optionEditorsRefs[questionIndex]?.[optionIndex], 'quiz-option-images');
                  }
                }}
                className="hidden"
                id={`option-${questionIndex}-${optionIndex}-image-upload`}
              />
              <label
                htmlFor={`option-${questionIndex}-${optionIndex}-image-upload`}
                className="p-2 rounded text-sm bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                title={isUploadingImage && uploadingEditor === 'quiz-option-images' ? 'Uploading...' : 'Insert Image'}
              >
                {isUploadingImage && uploadingEditor === 'quiz-option-images' ? (
                  <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </label>

            <div className='ml-auto'>
              <button
                type="button"
                onClick={() => {
                  const newQuestions = [...question.questions];
                  newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    options: newQuestions[questionIndex].options.map((opt: QuizOption) => ({
                      ...opt,
                      is_correct: opt.id === option.id
                    }))
                  };
                  question.setData('questions', newQuestions);
                }}
                className={`cursor-pointer p-2 rounded-full transition-colors ${
                  option.is_correct
                    ? 'bg-green-200 text-green-700 hover:bg-green-300'
                    : 'text-primary hover:bg-green-300'
                }`}
              >
                <CheckIcon className="w-5 h-5" />
              </button>
              {question.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(questionIndex, option.id)}
                  className="cursor-pointer text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <EditorContent 
            editor={optionEditorsRefs[questionIndex]?.[optionIndex]} 
            className="prose max-w-none p-4 min-h-[60px] focus:outline-none"
          />
        </div>
        {errors && errors[`questions.${questionIndex}.options.${optionIndex}.text`] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[`questions.${questionIndex}.options.${optionIndex}.text`]}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div
          {...attributes}
          {...listeners}
          className=" transition-opacity cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        
      </div>
    </div>
  );
}

export default function Edit({ quiz }: Props) {
  const { t } = useTranslation();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingEditor, setUploadingEditor] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const { data, setData, put, processing, errors } = useForm({
    title: quiz.title,
    description: quiz.description || '',
    is_published: quiz.is_published,
    questions: quiz.questions.map(q => ({
      ...q,
      options: q.options.map(o => ({
        ...o,
        id: o.id.toString(),
        is_correct: o.is_correct
      }))
    })),
  });

  // Image upload function
  const uploadImage = async (file: File, editor: any, collection: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploadingImage(true);
    setUploadingEditor(collection);
    
    try {
      const res = await axios.post(`/api/quizzes/${quiz.id}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          collection: collection
        }
      });
      
      const { url } = res.data;
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      toastConfig.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      setUploadingEditor(null);
    }
  };

  // Description editor
  const descriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Highlight.configure({
        multicolor: true,
      })
    ],
    content: data.description,
    editorProps: {
      handlePaste: (view, event, slice) => {
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          uploadImage(file, descriptionEditor, 'quiz-description-images');
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        const file = event.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          uploadImage(file, descriptionEditor, 'quiz-description-images');
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setData('description', editor.getHTML());
    },
  });

  // Create question editors
  const questionEditorsRefs = data.questions.map((question, questionIndex) => 
    useEditor({
      extensions: [
        StarterKit,
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        Highlight.configure({
          multicolor: true,
        })
      ],
      content: question.question,
      editorProps: {
        handlePaste: (view, event, slice) => {
          const file = event.clipboardData?.files?.[0];
          if (file && file.type.startsWith('image/')) {
            uploadImage(file, questionEditorsRefs[questionIndex], 'quiz-question-images');
            return true;
          }
          return false;
        },
        handleDrop: (view, event, slice, moved) => {
          const file = event.dataTransfer?.files?.[0];
          if (file && file.type.startsWith('image/')) {
            uploadImage(file, questionEditorsRefs[questionIndex], 'quiz-question-images');
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        const newQuestions = [...data.questions];
        newQuestions[questionIndex].question = editor.getHTML();
        setData('questions', newQuestions);
      },
    })
  );

  // Create option editors
  const optionEditorsRefs = data.questions.map((question, questionIndex) => 
    question.options.map((option, optionIndex) => 
      useEditor({
        extensions: [
          StarterKit,
          Image.configure({
            inline: false,
            allowBase64: false,
          }),
          Highlight.configure({
            multicolor: true,
          })
        ],
        content: option.text,
        editorProps: {
          handlePaste: (view, event, slice) => {
            const file = event.clipboardData?.files?.[0];
            if (file && file.type.startsWith('image/')) {
              uploadImage(file, optionEditorsRefs[questionIndex]?.[optionIndex], 'quiz-option-images');
              return true;
            }
            return false;
          },
          handleDrop: (view, event, slice, moved) => {
            const file = event.dataTransfer?.files?.[0];
            if (file && file.type.startsWith('image/')) {
              uploadImage(file, optionEditorsRefs[questionIndex]?.[optionIndex], 'quiz-option-images');
              return true;
            }
            return false;
          },
        },
        onUpdate: ({ editor }) => {
          const newQuestions = [...data.questions];
          newQuestions[questionIndex].options[optionIndex].text = editor.getHTML();
          setData('questions', newQuestions);
        },
      })
    )
  );

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      question: '',
      type: 'multiple_choice',
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '', is_correct: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', is_correct: false },
      ],
    };
    setData('questions', [...data.questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setData(
      'questions',
      data.questions.filter((q) => q.id !== questionId)
    );
  };


  const removeOption = (questionIndex: number, optionId: string) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].options = newQuestions[
      questionIndex
    ].options.filter((o) => o.id !== optionId);
    setData('questions', newQuestions);
  };

  // Handle drag end for options
  const handleDragEnd = (event: DragEndEvent, questionIndex: number) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const newQuestions = [...data.questions];
      const question = newQuestions[questionIndex];
      const oldIndex = question.options.findIndex((option) => option.id === active.id);
      const newIndex = question.options.findIndex((option) => option.id === over?.id);

      newQuestions[questionIndex] = {
        ...question,
        options: arrayMove(question.options, oldIndex, newIndex),
      };

      setData('questions', newQuestions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that multiple-choice and true-false questions have exactly one correct option
    const validationErrors: string[] = [];
    data.questions.forEach((question, index) => {
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        const correctOptions = question.options.filter(option => option.is_correct);
        if (correctOptions.length === 0) {
          validationErrors.push(`Question ${index + 1}: Please select a correct answer`);
        } else if (correctOptions.length > 1) {
          validationErrors.push(`Question ${index + 1}: Only one option can be marked as correct`);
        }
      }
    });
    
    if (validationErrors.length > 0) {
      toastConfig.error(validationErrors.join('. '));
      return;
    }
    
    put(`/quizzes/${quiz.id}`);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].options.push({
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      is_correct: false,
    });
    setData('questions', newQuestions);
  };


  return (
    <AppLayout>
      <Head title={t('edit_quiz')} />

      <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('edit_quiz')}</h1>

        {/* Display general errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.entries(errors).map(([key, message]) => (
                <li key={key} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>
                    <strong>{key.replace(/\./g, ' → ')}:</strong> {message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg mb-6 ">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('quiz_title')}</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">{t('quiz_description_optional')}</Label>
              <div className="border rounded-md">
                <div className="border-b p-2 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => descriptionEditor?.chain().focus().toggleBold().run()}
                    className={`p-2 rounded text-sm ${
                      descriptionEditor?.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    title="Bold"
                  >
                    <BoldIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => descriptionEditor?.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded text-sm ${
                      descriptionEditor?.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    title="Italic"
                  >
                    <ItalicIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => descriptionEditor?.chain().focus().toggleHighlight().run()}
                    className={`p-2 rounded text-sm ${
                      descriptionEditor?.isActive('highlight') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    title="Highlight"
                  >
                    <span className="w-4 h-4 bg-purple-200 rounded px-1">H</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadImage(file, descriptionEditor, 'quiz-description-images');
                      }
                    }}
                    className="hidden"
                    id="description-image-upload"
                  />
                  <label
                    htmlFor="description-image-upload"
                    className="p-2 rounded text-sm bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                    title={isUploadingImage && uploadingEditor === 'quiz-description-images' ? 'Uploading...' : 'Insert Image'}
                  >
                    {isUploadingImage && uploadingEditor === 'quiz-description-images' ? (
                      <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </label>
                </div>
                <EditorContent 
                  editor={descriptionEditor} 
                  className="prose max-w-none p-4 min-h-[100px] focus:outline-none"
                />
              </div>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={data.is_published}
                onCheckedChange={(checked) => setData('is_published', checked)}
              />
              <Label htmlFor="published">{t('quiz_published')}</Label>
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
              <div className="rounded-lg p-6 mb-6 border border-gray-200/50 backdrop-blur-sm bg-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{t('question_number', { number: questionIndex + 1 })}</h2>
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
                    <Label>{t('question_text')}</Label>
                    <div className={`border rounded-md ${
                      errors[`questions.${questionIndex}.question`] ? 'border-red-500' : ''
                    }`}>
                      <div className="border-b p-2 flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => questionEditorsRefs[questionIndex]?.chain().focus().toggleBold().run()}
                          className={`p-2 rounded text-sm ${
                            questionEditorsRefs[questionIndex]?.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          title="Bold"
                        >
                          <BoldIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => questionEditorsRefs[questionIndex]?.chain().focus().toggleItalic().run()}
                          className={`p-2 rounded text-sm ${
                            questionEditorsRefs[questionIndex]?.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          title="Italic"
                        >
                          <ItalicIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => questionEditorsRefs[questionIndex]?.chain().focus().toggleHighlight().run()}
                          className={`p-2 rounded text-sm ${
                            questionEditorsRefs[questionIndex]?.isActive('highlight') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          title="Highlight"
                        >
                          <span className="w-4 h-4 bg-purple-200 rounded px-1">H</span>
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              uploadImage(file, questionEditorsRefs[questionIndex], 'quiz-question-images');
                            }
                          }}
                          className="hidden"
                          id={`question-${questionIndex}-image-upload`}
                        />
                        <label
                          htmlFor={`question-${questionIndex}-image-upload`}
                          className="p-2 rounded text-sm bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                          title={isUploadingImage && uploadingEditor === 'quiz-question-images' ? 'Uploading...' : 'Insert Image'}
                        >
                          {isUploadingImage && uploadingEditor === 'quiz-question-images' ? (
                            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </label>
                      </div>
                      <EditorContent 
                        editor={questionEditorsRefs[questionIndex]} 
                        className="prose max-w-none p-4 min-h-[100px] focus:outline-none"
                      />
                    </div>
                    {errors[`questions.${questionIndex}.question`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`questions.${questionIndex}.question`]}
                      </p>
                    )}
                  </div>

                  {/* Question Type Error */}
                  {errors[`questions.${questionIndex}.type`] && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-sm">
                        <strong>Question Type Error:</strong> {errors[`questions.${questionIndex}.type`]}
                      </p>
                    </div>
                  )}



                  <div>
                    <Label className="mb-2">{t('question_type')}</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => {
                        const newQuestions = [...data.questions];
                        newQuestions[questionIndex].type = value;
                        setData('questions', newQuestions);
                      }}
                    >
                      <SelectTrigger className={errors[`questions.${questionIndex}.type`] ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true-false">True/False</SelectItem>
                        <SelectItem value="fill-in-blank">Fill in the Blank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                  <div>
                    <Label className="mb-2">{t('options')}</Label>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, questionIndex)}
                    >
                      <SortableContext
                        items={question.options.map((option) => option.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {question.options.map((option, optionIndex) => (
                           <SortableOption
                              key={option.id}
                              option={option}
                              questionIndex={questionIndex}
                              optionIndex={optionIndex}
                              question={{
                                ...question,
                                questions: data.questions,
                                setData
                              }}
                              optionEditorsRefs={optionEditorsRefs}
                              isUploadingImage={isUploadingImage}
                              uploadingEditor={uploadingEditor}
                              uploadImage={uploadImage}
                              removeOption={removeOption}
                              errors={errors}
                            />
                         ))}
                      </SortableContext>
                    </DndContext>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOption(questionIndex)}
                      className="mt-2"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      {t('add_option')}
                    </Button>
                  </div>

                  <div>
                    <Label>{t('explanation_optional')}</Label>
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
            {t('add_question')}
          </Button>
          <Button
            type="submit"
            disabled={processing}
          >
            {t('save')}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}