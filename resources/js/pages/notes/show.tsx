import { Head } from '@inertiajs/react';
import { Note } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Folder, Tag, Menu, X } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import React, { useRef, useState } from 'react';

dayjs.extend(relativeTime);

interface ShowProps {
    note: Note;
}

export default function Show({ note }: ShowProps) {
    const { t } = useTranslation();
    const contentRef = useRef<HTMLDivElement>(null);
    const [readingProgress, setReadingProgress] = useState(0);
    const [tocOpen, setTocOpen] = useState(false);
    const [tocItems, setTocItems] = useState<Array<{id: string, text: string, level: number}>>([]);

    // Word count utility function
    const getWordCount = (htmlContent: string): number => {
        if (!htmlContent) return 0;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    };

    // Extract table of contents from HTML content
    const extractTOC = (htmlContent: string) => {
        if (!htmlContent) return [];
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        return Array.from(headings).map((heading, index) => {
            const id = `heading-${index}`;
            const text = heading.textContent || '';
            const level = parseInt(heading.tagName.charAt(1));
            return { id, text, level };
        });
    };

    // Handle scroll for reading progress
    const handleScroll = () => {
        if (!contentRef.current) return;
        
        const element = contentRef.current;
        const scrollTop = window.scrollY;
        const scrollHeight = element.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
        
        setReadingProgress(progress);
    };

    // Initialize TOC and scroll listener
    React.useEffect(() => {
        const toc = extractTOC(note.content || '');
        setTocItems(toc);
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [note.content]);

    const wordCount = getWordCount(note.content || '');
    const audioFiles = note.media?.filter(media => media.collection_name === 'note-audio') || [];
    const estimatedReadingTime = Math.ceil(wordCount / 200); // Average reading speed

    return (
        <>
            <Head title={note.title} />
            
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            {/* Floating TOC */}
            {tocItems.length > 3 && (
                <>
                    <button
                        onClick={() => setTocOpen(!tocOpen)}
                        className="fixed top-20 right-6 z-40 p-3 bg-white dark:bg-gray-950 rounded-full shadow-lg border-0 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
                        aria-label="Toggle Table of Contents"
                    >
                        {tocOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    
                    {tocOpen && (
                        <div className="fixed top-32 right-6 z-30 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Table of Contents</h3>
                            <nav className="space-y-1">
                                {tocItems.map((item, index) => (
                                    <a
                                        key={index}
                                        href={`#heading-${index}`}
                                        className={`block py-2 px-3 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                            item.level === 1 ? 'font-semibold text-gray-900 dark:text-white' :
                                            item.level === 2 ? 'font-medium text-gray-800 dark:text-gray-200 ml-4' :
                                            'text-gray-600 dark:text-gray-400 ml-8'
                                        }`}
                                        onClick={() => setTocOpen(false)}
                                    >
                                        {item.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    )}
                </>
            )}
            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Enhanced Header with Gradient */}
                    <div className="relative mb-12 p-8 rounded-2xl bg-black/50 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="absolute inset-0 rounded-2xl"></div>
                        <div className="relative">
                            
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-6 leading-tight">
                                {note.title}
                            </h1>
                        
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">{dayjs(note.created_at).fromNow()}</span>
                                </div>
                                
                                {note.folder && (
                                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                        <Folder className="w-4 h-4" />
                                        <span className="font-medium">{note.folder.name}</span>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                    <span className="font-medium">{wordCount} {t('words')}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium">{estimatedReadingTime} min read</span>
                                </div>
                            </div>
                        
                            {note.tags && note.tags.length > 0 && (
                                <div className="flex items-center gap-3 mt-6">
                                    <Tag className="w-4 h-4 text-gray-500" />
                                    <div className="flex flex-wrap gap-2">
                                        {note.tags.map((tag) => (
                                            <Badge 
                                                key={tag.id} 
                                                variant="secondary" 
                                                className="text-xs px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-0 text-blue-700 dark:text-blue-300 font-medium"
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    

                    
                    {/* Enhanced Audio Player */}
                    {audioFiles.length > 0 && (
                        <Card className="mb-10 shadow-xl border-0 bg-gradient-to-r from-white to-gray-50 ">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('audio_recording')}</h3>
                                {audioFiles.map((audio, index) => (
                                    <div key={index} className="mb-6 last:mb-0 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
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
                    
                    {/* Enhanced Note Content */}
                    <Card className="shadow-2xl border-0 bg-white  overflow-hidden">
                        <CardContent className="p-10 md:p-12" ref={contentRef}>
                            <div 
                                className="tiptap prose prose-xl max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-12 prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-10 prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8 prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-6 prose-pre:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-ul:space-y-2 prose-ol:space-y-2 prose-li:text-gray-700 dark:prose-li:text-gray-300 "
                                dangerouslySetInnerHTML={{ 
                                    __html: (note.content || '').replace(
                                        /<(h[1-6])([^>]*)>/g, 
                                        (match, tag, attrs, offset) => {
                                            const index = (note.content?.substring(0, offset).match(/<h[1-6][^>]*>/g) || []).length;
                                            return `<${tag} id="heading-${index}"${attrs}>`;
                                        }
                                    )
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}