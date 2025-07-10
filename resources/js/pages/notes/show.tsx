import { Head } from '@inertiajs/react';
import { Note } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Folder, Tag } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

dayjs.extend(relativeTime);

interface ShowProps {
    note: Note;
}

export default function Show({ note }: ShowProps) {
    const { t } = useTranslation();

    // Word count utility function
    const getWordCount = (htmlContent: string): number => {
        if (!htmlContent) return 0;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    };

    const wordCount = getWordCount(note.content || '');
    const audioFiles = note.media?.filter(media => media.collection_name === 'note-audio') || [];

    return (
        <>
            <Head title={note.title} />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <span>CleverNote</span>
                            <span>•</span>
                            <span>{t('public_note')}</span>
                        </div>
                        
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {note.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{dayjs(note.created_at).fromNow()}</span>
                            </div>
                            
                            {note.folder && (
                                <div className="flex items-center gap-1">
                                    <Folder className="w-4 h-4" />
                                    <span>{note.folder.name}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                                <span>{wordCount} {t('words')}</span>
                            </div>
                        </div>
                        
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex items-center gap-2 mt-4">
                                <Tag className="w-4 h-4 text-gray-500" />
                                <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag) => (
                                        <Badge key={tag.id} variant="secondary" className="text-xs">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Separator className="mb-8" />
                    
                    {/* Audio Player */}
                    {audioFiles.length > 0 && (
                        <Card className="mb-8">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4">{t('audio_recording')}</h3>
                                {audioFiles.map((audio, index) => (
                                    <div key={index} className="mb-4 last:mb-0">
                                        <AudioPlayer
                                            src={audio.original_url}
                                            showJumpControls={false}
                                            showDownloadProgress={false}
                                            customAdditionalControls={[]}
                                            customVolumeControls={[]}
                                            layout="horizontal-reverse"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Note Content */}
                    <Card>
                        <CardContent className="p-8">
                            <div 
                                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
                                dangerouslySetInnerHTML={{ __html: note.content || '' }}
                            />
                        </CardContent>
                    </Card>
                    
                    {/* Summary */}
                    {note.summary && (
                        <Card className="mt-8">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4">{t('summary')}</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {note.summary}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                            <p>{t('powered_by')} <span className="font-semibold">CleverNote</span></p>
                            <p className="mt-1">{t('create_your_own_notes')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}