import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toastConfig } from '@/lib/toast';
import { Quiz } from '@/types';

type CreateQuizModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const defaultColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
];

export function CreateQuizModal({ isOpen, onClose }: CreateQuizModalProps) {
    const { t } = useTranslation();
    const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        thumbnail_color: defaultColors[0],
        thumbnail_file: null as File | null,
    });

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        setData('thumbnail_color', color);
        // Clear file selection when color is selected
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setData('thumbnail_file', null);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (3MB max)
            if (file.size > 3 * 1024 * 1024) {
                alert('File size must be less than 3MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            setThumbnailFile(file);
            setData('thumbnail_file', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Clear color selection when file is selected
            setSelectedColor('');
            setData('thumbnail_color', '');
        }
    };

    const handleRemoveFile = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setData('thumbnail_file', null);
        setSelectedColor(defaultColors[0]);
        setData('thumbnail_color', defaultColors[0]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/quizzes', {
            onSuccess: () => {
                toastConfig.success(t('record_created_successfully'))
            },
        });
    };

    const handleClose = () => {
        reset();
        setSelectedColor(defaultColors[0]);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Create new Quiz')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Thumbnail Section */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">{t('Thumbnail')}</Label>
                        
                        {/* Preview */}
                        <div className="flex justify-center">
                            <div 
                                className="w-32 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: thumbnailPreview ? 'transparent' : selectedColor }}
                            >
                                {thumbnailPreview ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={thumbnailPreview} 
                                            alt="Thumbnail preview" 
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-white text-xs font-medium">Preview</span>
                                )}
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">{t('Choose a color')}</Label>
                            <div className="flex gap-2 justify-center">
                                {defaultColors.map((color) => (
                                    <motion.button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                            selectedColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleColorSelect(color)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">{t('Or upload an image (max 3MB)')}</Label>
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {t('Upload Image')}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quiz Details */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('Quiz Title')}</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder={t('Enter quiz title')}
                                className={errors.title ? 'border-red-500' : ''}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('Description')} ({t('optional')})</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder={t('Let your learners know a little about the quiz')}
                                rows={3}
                                className={errors.description ? 'border-red-500' : ''}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.title.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {processing ? t('Creating...') : t('Create Quiz')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}