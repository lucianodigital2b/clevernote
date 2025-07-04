import React, { useState, useEffect, useRef } from 'react';
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
import { useEditor, EditorContent, Editor } from '@tiptap/react';
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
                onClick={() => optionEditorsRefs.current[questionIndex]?.[optionIndex]?.chain().focus().toggleBold().run()}
                className={`p-2 rounded text-sm dark:bg-transparent cursor-pointer ${
                  optionEditorsRefs.current[questionIndex]?.[optionIndex]?.isActive('bold') ? 'bg-blue-300 text-white' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title="Bold"
              >
                <BoldIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => optionEditorsRefs.current[questionIndex]?.[optionIndex]?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded text-sm dark:bg-transparent cursor-pointer ${
                  optionEditorsRefs.current[questionIndex]?.[optionIndex]?.isActive('italic') ? 'bg-blue-300 text-white' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title="Italic"
              >
                <ItalicIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => optionEditorsRefs.current[questionIndex]?.[optionIndex]?.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded text-sm dark:bg-transparent cursor-pointer ${
                  optionEditorsRefs.current[questionIndex]?.[optionIndex]?.isActive('highlight') ? 'bg-blue-300 text-white' : 'bg-gray-50 hover:bg-gray-100'
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
                    uploadImage(file, optionEditorsRefs.current[questionIndex]?.[optionIndex], 'quiz-option-images');
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
            editor={optionEditorsRefs.current[questionIndex]?.[optionIndex]} 
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

  // Create refs for editors
  const questionEditorsRefs = useRef<any[]>([]);
  const optionEditorsRefs = useRef<any[][]>([]);

  // Initialize and manage question editors
  useEffect(() => {
    // Clean up old editors that are no longer needed
    if (questionEditorsRefs.current.length > data.questions.length) {
      for (let i = data.questions.length; i < questionEditorsRefs.current.length; i++) {
        questionEditorsRefs.current[i]?.destroy();
      }
      questionEditorsRefs.current = questionEditorsRefs.current.slice(0, data.questions.length);
    }

    // Create or update question editors
    data.questions.forEach((question, questionIndex) => {
      if (!questionEditorsRefs.current[questionIndex]) {
        questionEditorsRefs.current[questionIndex] = new Editor({
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
          editable: true,
          editorProps: {
            handlePaste: (view, event, slice) => {
              const file = event.clipboardData?.files?.[0];
              if (file && file.type.startsWith('image/')) {
                uploadImage(file, questionEditorsRefs.current[questionIndex], 'quiz-question-images');
                return true;
              }
              return false;
            },
            handleDrop: (view, event, slice, moved) => {
              const file = event.dataTransfer?.files?.[0];
              if (file && file.type.startsWith('image/')) {
                uploadImage(file, questionEditorsRefs.current[questionIndex], 'quiz-question-images');
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
          onCreate: ({ editor }) => {
            // Ensure editor is immediately editable
            setTimeout(() => {
              editor.setEditable(true);
            }, 0);
          },
        });
      } else {
        // Update content if it has changed
        const currentContent = questionEditorsRefs.current[questionIndex].getHTML();
        if (currentContent !== question.question) {
          questionEditorsRefs.current[questionIndex].commands.setContent(question.question);
        }
        // Ensure editor remains editable
        questionEditorsRefs.current[questionIndex].setEditable(true);
      }
    });
  }, [data.questions.length]);

  // Initialize and manage option editors
  useEffect(() => {
    // Clean up old option editors
    if (optionEditorsRefs.current.length > data.questions.length) {
      for (let i = data.questions.length; i < optionEditorsRefs.current.length; i++) {
        optionEditorsRefs.current[i]?.forEach(editor => editor?.destroy());
      }
      optionEditorsRefs.current = optionEditorsRefs.current.slice(0, data.questions.length);
    }

    // Create or update option editors
    data.questions.forEach((question, questionIndex) => {
      if (!optionEditorsRefs.current[questionIndex]) {
        optionEditorsRefs.current[questionIndex] = [];
      }

      // Clean up old option editors for this question
      if (optionEditorsRefs.current[questionIndex].length > question.options.length) {
        for (let i = question.options.length; i < optionEditorsRefs.current[questionIndex].length; i++) {
          optionEditorsRefs.current[questionIndex][i]?.destroy();
        }
        optionEditorsRefs.current[questionIndex] = optionEditorsRefs.current[questionIndex].slice(0, question.options.length);
      }

      question.options.forEach((option, optionIndex) => {
        if (!optionEditorsRefs.current[questionIndex][optionIndex]) {
          optionEditorsRefs.current[questionIndex][optionIndex] = new Editor({
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
                  uploadImage(file, optionEditorsRefs.current[questionIndex]?.[optionIndex], 'quiz-option-images');
                  return true;
                }
                return false;
              },
              handleDrop: (view, event, slice, moved) => {
                const file = event.dataTransfer?.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  uploadImage(file, optionEditorsRefs.current[questionIndex]?.[optionIndex], 'quiz-option-images');
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
          });
        } else {
          // Update content if it has changed
          const currentContent = optionEditorsRefs.current[questionIndex][optionIndex].getHTML();
          if (currentContent !== option.text) {
            optionEditorsRefs.current[questionIndex][optionIndex].commands.setContent(option.text);
          }
        }
      });
    });
  }, [data.questions.map(q => q.options.length).join(','), data.questions.length]);

  // Cleanup editors on unmount
  useEffect(() => {
    return () => {
      // Destroy all question editors
      questionEditorsRefs.current.forEach(editor => editor?.destroy());
      // Destroy all option editors
      optionEditorsRefs.current.forEach(questionEditors => 
        questionEditors?.forEach(editor => editor?.destroy())
      );
    };
  }, []);

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
    const newQuestions = [...data.questions, newQuestion];
    setData('questions', newQuestions);
    
    // Wait for React to re-render and editors to be created
    setTimeout(() => {
      const newQuestionIndex = newQuestions.length - 1;
      
      // Ensure the question editor is created and focusable
      const checkEditor = () => {
        if (questionEditorsRefs.current[newQuestionIndex]) {
          // Ensure editor is editable and focus it
          questionEditorsRefs.current[newQuestionIndex].setEditable(true);
          setTimeout(() => {
            questionEditorsRefs.current[newQuestionIndex]?.commands.focus();
          }, 50);
        } else {
          // If editor not ready, check again
          setTimeout(checkEditor, 50);
        }
      };
      
      checkEditor();
      
      // Enhanced scroll to new question with animation timing consideration
      setTimeout(() => {
        const questionElements = document.querySelectorAll('[data-question-index]');
        const lastQuestionElement = questionElements[questionElements.length - 1];
        if (lastQuestionElement) {
          // Add a subtle highlight effect before scrolling
          lastQuestionElement.style.transform = 'scale(1.02)';
          lastQuestionElement.style.transition = 'transform 0.3s ease-out';
          
          setTimeout(() => {
            lastQuestionElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Reset the highlight effect
            setTimeout(() => {
              lastQuestionElement.style.transform = '';
            }, 500);
          }, 200);
        }
      }, 300);
    }, 150); // Allow more time for editors to be created
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
    
    put(`/quizzes/${quiz.id}`,{
        onSuccess: () => toastConfig.success(t('updated_successfully')),
    });
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

      <form onSubmit={handleSubmit} className="py-6 max-w-4xl mx-auto" style={{width: '100%'}}>
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

        {/* Questions Section */}
        {data.questions.length === 0 ? (
          <motion.div 
            className="rounded-lg p-8 mb-6 border-2 border-dashed border-indigo-300 text-center bg-indigo-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="max-w-md mx-auto">
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 bg-indigo-200 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <PlusIcon className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <motion.h3 
                className="text-lg font-medium text-indigo-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                {t('no_questions_yet')}
              </motion.h3>
              <motion.p 
                className="text-indigo-500 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {t('add_your_first_question_to_get_started')}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  onClick={addQuestion}
                  className="mx-auto bg-indigo-500 hover:bg-indigo-600"

                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  {t('add_question')}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {data.questions.map((question, questionIndex) => (
              <motion.div
                key={question.id}
                data-question-index={questionIndex}
                layout
                initial={{ 
                  opacity: 0, 
                  y: 50,
                  scale: 0.9,
                  rotateX: -15
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                  rotateX: 0
                }}
                exit={{ 
                  opacity: 0, 
                  y: -50,
                  scale: 0.9,
                  rotateX: 15,
                  transition: { duration: 0.3, ease: "easeIn" }
                }}
                transition={{ 
                  duration: 0.5,
                  delay: questionIndex * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                style={{
                  transformPerspective: 1000
                }}
              >
              <div className="rounded-lg p-6 mb-6 border border-gray-200/50 backdrop-blur-sm bg-white/5">
                <div className="flex justify-between items-center mb-4">
                  <motion.h2 
                    className="text-xl font-semibold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + questionIndex * 0.1, duration: 0.3 }}
                  >
                    {t('question_number', { number: questionIndex + 1 })}
                  </motion.h2>
                  <motion.button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + questionIndex * 0.1, duration: 0.3, type: "spring" }}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>{t('description')}</Label>
                    <div className={`border rounded-md ${
                      errors[`questions.${questionIndex}.question`] ? 'border-red-500' : ''
                    }`}>
                      <div className="border-b p-2 flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => questionEditorsRefs.current[questionIndex]?.chain().focus().toggleBold().run()}
                          className={`p-2 rounded text-sm ${
                            questionEditorsRefs.current[questionIndex]?.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          title="Bold"
                        >
                          <BoldIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => questionEditorsRefs.current[questionIndex]?.chain().focus().toggleItalic().run()}
                          className={`p-2 rounded text-sm ${
                            questionEditorsRefs.current[questionIndex]?.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          title="Italic"
                        >
                          <ItalicIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => questionEditorsRefs.current[questionIndex]?.chain().focus().toggleHighlight().run()}
                          className={`p-2 rounded text-sm ${
                            questionEditorsRefs.current[questionIndex]?.isActive('highlight') ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100'
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
                              uploadImage(file, questionEditorsRefs.current[questionIndex], 'quiz-question-images');
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
                      {questionEditorsRefs.current[questionIndex] && (
                         <EditorContent 
                           editor={questionEditorsRefs.current[questionIndex]} 
                           className="prose max-w-none p-4 min-h-[100px] focus:outline-none"
                         />
                       )}
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
                    <Label className="mb-2">{t('type')}</Label>
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
                        <SelectItem value="multiple_choice">{t('multiple_choice')}</SelectItem>
                        {/* <SelectItem value="true-false">True/False</SelectItem>
                        <SelectItem value="fill-in-blank">Fill in the Blank</SelectItem> */}
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
        )}

        {/* Fixed floating bottom bar */}
        <motion.div 
          className="fixed bottom-5 left-0 right-0 bg-white border shadow-lg p-4 z-50 w-fit mx-auto rounded-2xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 100 }}
        >
          <div className="max-w-2xl mx-auto flex gap-4 justify-between">
            <div className="flex gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  {t('add_question')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this quiz?')) {
                      // Add delete functionality here
                      window.location.href = `/quizzes/${quiz.id}/delete`;
                    }
                  }}
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  {t('delete')}
                </Button>
              </motion.div>
            </div>
            <div className="flex gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    window.location.href = `/quizzes/${quiz.id}`;
                  }}
                >
                  {t('Take Quiz')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="submit"
                  disabled={processing}
                >
                  {t('save')}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Add bottom padding to prevent content from being hidden behind fixed bar */}
        <div className="h-24"></div>
      </form>
    </AppLayout>
  );
}