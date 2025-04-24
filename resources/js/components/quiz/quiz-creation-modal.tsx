import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { QuizQuestion, QuizOption } from '@/types/quiz';
import { motion, AnimatePresence } from 'framer-motion';

type QuizCreationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (questions: QuizQuestion[]) => void;
};

export function QuizCreationModal({ isOpen, onClose, onSave }: QuizCreationModalProps) {
    const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([{
        type: 'multiple-choice',
        options: [{ id: '1', text: '' }, { id: '2', text: '' }],
        correctOptionId: '1'
    }]);

    const addQuestion = () => {
        setQuestions([...questions, {
            type: 'multiple-choice',
            options: [{ id: '1', text: '' }, { id: '2', text: '' }],
            correctOptionId: '1'
        }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuestions(updatedQuestions);
    };

    const addOption = (questionIndex: number) => {
        const updatedQuestions = [...questions];
        const question = updatedQuestions[questionIndex];
        if (question.options) {
            const newOptionId = (question.options.length + 1).toString();
            question.options.push({ id: newOptionId, text: '' });
            setQuestions(updatedQuestions);
        }
    };

    const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
        const updatedQuestions = [...questions];
        const question = updatedQuestions[questionIndex];
        if (question.options) {
            question.options[optionIndex].text = text;
            setQuestions(updatedQuestions);
        }
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updatedQuestions = [...questions];
        const question = updatedQuestions[questionIndex];
        if (question.options) {
            question.options = question.options.filter((_, i) => i !== optionIndex);
            setQuestions(updatedQuestions);
        }
    };

    const handleSave = () => {
        const validQuestions = questions.filter(q => 
            q.question && 
            q.type && 
            q.options?.length >= 2 && 
            q.options.every(o => o.text) && 
            q.correctOptionId
        ) as QuizQuestion[];

        if (validQuestions.length > 0) {
            onSave(validQuestions.map((q, i) => ({ ...q, id: (i + 1).toString() })));
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Quiz</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <AnimatePresence>
                        {questions.map((question, questionIndex) => (
                            <motion.div
                                key={questionIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-4 border rounded-lg space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Question {questionIndex + 1}</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeQuestion(questionIndex)}
                                        disabled={questions.length === 1}
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label>Question Type</Label>
                                        <Select
                                            value={question.type}
                                            onValueChange={(value) => updateQuestion(questionIndex, 'type', value)}
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
                                        <Label>Question Text</Label>
                                        <Textarea
                                            value={question.question || ''}
                                            onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                                            placeholder="Enter your question"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        {question.options?.map((option, optionIndex) => (
                                            <div key={option.id} className="flex gap-2">
                                                <Input
                                                    value={option.text}
                                                    onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                                    placeholder={`Option ${optionIndex + 1}`}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                                    disabled={question.options?.length <= 2}
                                                >
                                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addOption(questionIndex)}
                                            className="mt-2"
                                        >
                                            <PlusIcon className="w-4 h-4 mr-2" />
                                            Add Option
                                        </Button>
                                    </div>

                                    <div>
                                        <Label>Correct Answer</Label>
                                        <Select
                                            value={question.correctOptionId}
                                            onValueChange={(value) => updateQuestion(questionIndex, 'correctOptionId', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select correct answer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {question.options?.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        {option.text || `Option ${option.id}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Explanation (Optional)</Label>
                                        <Textarea
                                            value={question.explanation || ''}
                                            onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                                            placeholder="Explain why this answer is correct"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={addQuestion}
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Question
                        </Button>

                        <Button
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Save Quiz
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}