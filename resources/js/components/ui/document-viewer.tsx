import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { 
    ChevronLeft, 
    ChevronRight, 
    ZoomIn, 
    ZoomOut, 
    RotateCw, 
    Download,
    FileText,
    Presentation,
    Maximize2,
    Minimize2,
    Loader2,
    Brain,
    Layers,
    Map,
    Mic,
    Play,
    Eye,
    Sparkles,
    X,
    Folder,
    Zap,
    Clock
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import axios from 'axios';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { QuizContent } from '@/components/quiz/quiz-content';
import { StudyCompletionScreen } from '@/components/study/StudyCompletionScreen';
import { QuizTab } from '@/components/tabs/quiz-tab';
import { FlashcardTab } from '@/components/tabs/flashcard-tab';
import { MindmapTab } from '@/components/tabs/mindmap-tab';
import ReactFlow, { 
    Controls, 
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

// Set up PDF.js worker - use react-pdf's internal pdfjs-dist to avoid version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface DocumentViewerProps {
    fileUrl?: string;
    fileName?: string;
    fileType?: 'pdf' | 'ppt' | 'pptx' | 'doc' | 'docx' | 'xls' | 'xlsx';
    className?: string;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
    note?: any;
    onGenerateQuiz?: () => void;
    onGenerateFlashcards?: () => void;
    onGenerateMindmap?: () => void;
    onGeneratePodcast?: () => void;
    onFolderChange?: (folderId: number | null) => void;
    isLoading?: boolean;
}

type TabType = 'note' | 'quiz' | 'flashcards' | 'mindmap' | 'podcast';

const DocumentViewer: React.FC<DocumentViewerProps> = ({
    fileUrl,
    fileName,
    fileType,
    className = '',
    isFullscreen = false,
    onToggleFullscreen,
    note,
    onGenerateQuiz,
    onGenerateFlashcards,
    onGenerateMindmap,
    onGeneratePodcast,
    onFolderChange,
    isLoading = false
}) => {
    const { t } = useTranslation();
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [rotation, setRotation] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('note');
    
    // Folder modal state
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<number | null>(note?.folder_id || null);
    const [folders, setFolders] = useState<Array<{id: number; name: string}>>([]);
    
    // Study mode selection state
    const [selectedStudyMode, setSelectedStudyMode] = useState<'fast' | 'spaced' | null>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        console.log('PDF loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('Error loading document:', error);
        let errorMessage = 'Failed to load document';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to access the document. Please check if the file exists and is accessible.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'Document access blocked by security policy. Please contact support.';
        } else if (error.message.includes('Invalid PDF')) {
            errorMessage = 'The file appears to be corrupted or is not a valid PDF.';
        } else {
            errorMessage = `Failed to load document: ${error.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
    }, []);

    const goToPrevPage = () => {
        setPageNumber(prev => Math.max(1, prev - 1));
    };

    const goToNextPage = () => {
        setPageNumber(prev => Math.min(numPages, prev + 1));
    };

    const zoomIn = () => {
        setScale(prev => Math.min(3.0, prev + 0.2));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(0.5, prev - 0.2));
    };

    const rotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const downloadFile = () => {
        if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Folder handlers
    const handleSaveFolder = () => {
        if (onFolderChange) {
            onFolderChange(selectedFolder);
        }
        setIsFolderModalOpen(false);
    };

    // Fetch folders when modal opens
    useEffect(() => {
        if (isFolderModalOpen) {
            axios.get('/folders').then(response => {
                setFolders(response.data);
            }).catch(error => {
                console.error('Error fetching folders:', error);
            });
        }
    }, [isFolderModalOpen]);

    const getFileIcon = () => {
        switch (fileType) {
            case 'pdf':
                return <FileText className="h-4 w-4" />;
            case 'ppt':
            case 'pptx':
                return <Presentation className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const tabs = [
        {
            id: 'note' as TabType,
            label: t('Note'),
            icon: <FileText className="h-4 w-4" />,
            color: 'bg-gray-500',
            hasContent: true,
            onGenerate: undefined
        },
        {
            id: 'quiz' as TabType,
            label: t('Quizzes'),
            icon: <Brain className="h-4 w-4" />,
            color: 'bg-blue-500',
            hasContent: note?.quizzes && note.quizzes.length > 0,
            onGenerate: onGenerateQuiz
        },
        {
            id: 'flashcards' as TabType,
            label: t('Flashcards'),
            icon: <Layers className="h-4 w-4" />,
            color: 'bg-green-500',
            hasContent: note?.flashcard_sets && note.flashcard_sets.length > 0,
            onGenerate: onGenerateFlashcards
        },
        {
            id: 'mindmap' as TabType,
            label: t('mindmap'),
            icon: <Map className="h-4 w-4" />,
            color: 'bg-purple-500',
            hasContent: note?.mindmaps && note.mindmaps.length > 0,
            onGenerate: onGenerateMindmap
        },
        {
            id: 'podcast' as TabType,
            label: t('Podcast'),
            icon: <Mic className="h-4 w-4" />,
            color: 'bg-orange-500',
            hasContent: note?.podcast_url,
            onGenerate: onGeneratePodcast
        }
    ];

    const renderPDFViewer = () => (
        <div className="h-full flex flex-col">
            {/* PDF Controls */}
            <div className="flex items-center justify-between p-3 border-b  dark:bg-gray-800/50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="rounded-full h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-3 py-1 bg-white dark:bg-gray-700 rounded-full border">
                        {pageNumber} / {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="rounded-full h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={zoomOut} className="rounded-full h-8 w-8 p-0">
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-3 py-1 bg-white dark:bg-gray-700 rounded-full border min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={zoomIn} className="rounded-full h-8 w-8 p-0">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={rotate} className="rounded-full h-8 w-8 p-0">
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadFile} className="rounded-full h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* PDF Content */}
            <ScrollArea className="flex-1">
                <div className="flex justify-center p-4">
                    {loading && (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500 p-4">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-center max-w-md">{error}</p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                    setError(null);
                                    setLoading(true);
                                    // Force reload by updating the key
                                    const documentElement = document.querySelector('[data-testid="react-pdf__Document"]');
                                    if (documentElement) {
                                        documentElement.remove();
                                    }
                                }}
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                    {!error && (
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={null}
                            error={null}
                            options={{
                                cMapUrl: 'https://unpkg.com/pdfjs-dist@5.3.93/cmaps/',
                                cMapPacked: true,
                                standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.3.93/standard_fonts/',
                            }}
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                rotate={rotation}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="shadow-lg rounded-lg overflow-hidden"
                            />
                        </Document>
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    const renderOfficeViewer = () => {
        const docs = [
            {
                uri: fileUrl,
                fileName: fileName || 'document',
                fileType: fileType || 'ppt'
            }
        ];

        return (
            <div className="h-full rounded-2xl overflow-hidden">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                <DocViewer
                    documents={docs}
                    pluginRenderers={DocViewerRenderers}
                    style={{ height: '100%' }}
                    config={{
                        header: {
                            disableHeader: true,
                        },
                        csvDelimiter: ',',
                        pdfZoom: {
                            defaultZoom: 1.0,
                            zoomJump: 0.2,
                        },
                    }}
                    onDocumentLoadSuccess={() => setLoading(false)}
                    onDocumentLoadFailed={() => {
                        setError('Failed to load document');
                        setLoading(false);
                    }}
                />
            </div>
        );
    };

    const renderTabContent = () => {
        const activeTabData = tabs.find(tab => tab.id === activeTab);
        
        if (!activeTabData?.hasContent) {
            return (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className={`w-16 h-16 ${activeTabData?.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                            <div className="text-white">
                                {activeTabData?.icon}
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Generate {activeTabData?.label}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            Create interactive {activeTabData?.label.toLowerCase()} from your note content to enhance learning.
                        </p>
                        <Button
                            onClick={activeTabData?.onGenerate}
                            className="rounded-full px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate {activeTabData?.label}
                        </Button>
                    </div>
                </div>
            );
        }

        // Render existing content based on tab type
        switch (activeTab) {
            case 'note':
                return (
                    <div className="flex-1 p-4">
                        <ScrollArea className="h-full">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <h3 className="text-lg font-semibold mb-4">{note?.title || 'Note Content'}</h3>
                                <div 
                                    className="text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: note?.content || 'No content available' }}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                );
            case 'quiz':
                if (note?.quizzes?.[0]) {
                    return (
                        <div className="flex-1 overflow-hidden">
                            <QuizTab
                                quiz={note.quizzes[0]}
                            />
                        </div>
                    );
                }
                break;
            case 'flashcards':
                if (note?.flashcard_sets?.[0]) {
                    // Show study mode selection cards if no mode is selected
                    if (selectedStudyMode === null) {
                        return (
                            <div className="flex-1 overflow-hidden p-8">
                                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold mb-2">{t('study_mode_selection_title')}</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {t('study_mode_selection_description')}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                        {/* Fast Review Mode */}
                                        <Card 
                                            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 hover:scale-105"
                                            onClick={() => setSelectedStudyMode('fast')}
                                        >
                                            <CardContent className="p-8">
                                                <div className="text-center">
                                                    <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full inline-block mb-4">
                                                        <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-xl mb-3">{t('fast_review_title')}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {t('fast_review_description')}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Spaced Repetition Mode */}
                                        <Card 
                                            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-300 hover:scale-105"
                                            onClick={() => setSelectedStudyMode('spaced')}
                                        >
                                            <CardContent className="p-8">
                                                <div className="text-center">
                                                    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full inline-block mb-4">
                                                        <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-xl mb-3">{t('spaced_repetition_title')}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {t('spaced_repetition_description')}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    
                    // Show FlashcardTab with selected mode
                    return (
                        <div className="flex-1 overflow-hidden">
                            <FlashcardTab
                                flashcardSet={note.flashcard_sets[0]}
                                isFastMode={selectedStudyMode === 'fast'}
                            />
                        </div>
                    );
                }
                break;
            case 'mindmap':
                if (note?.mindmaps?.[0]) {
                    return (
                        <div className="flex-1 h-full">
                            <MindmapTab
                                mindmap={note.mindmaps[0]}
                                className="h-full"
                            />
                        </div>
                    );
                }
                break;
            case 'podcast':
                if (note?.podcast_url) {
                    return (
                        <div className="flex-1 p-4">
                            <div className="max-w-md mx-auto">
                                <h3 className="text-lg font-semibold mb-4 text-center">Podcast</h3>
                                <AudioPlayer
                                    src={note.podcast_url}
                                    showJumpControls={false}
                                    customProgressBarSection={[]}
                                    customControlsSection={['MAIN_CONTROLS']}
                                    layout="horizontal-reverse"
                                    className="rounded-2xl"
                                />
                            </div>
                        </div>
                    );
                }
                break;
        }

        return null;
    };

    if (!fileUrl && !isLoading) {
        return (
            <Card className={`h-full rounded-2xl border-0 shadow-lg ${className}`}>
                <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No document selected</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card className={`h-full rounded-2xl border-0 shadow-lg ${className}`}>
                <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                        <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                        <p>Processing document...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`h-full flex ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''} ${className}`}>
            {/* Document Viewer Section */}
            <div className={`${isFullscreen ? 'w-1/2' : 'w-1/2'} flex flex-col`}>
                <Card className="h-full rounded-2xl border-0 shadow-lg overflow-hidden">
                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {fileType === 'pdf' ? renderPDFViewer() : renderOfficeViewer()}
                    </div>
                </Card>
            </div>

            {/* Tabs Section - Always visible */}
            <div className="w-1/2 flex flex-col ml-4">
                <Card className="h-full rounded-2xl border-0 shadow-lg overflow-hidden">
                    {/* Tab Headers */}
                    <div className="p-4 border-b  dark:bg-gray-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleFullscreen}
                                className="rounded-full h-8 w-8 p-0"
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>

                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setIsFolderModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Folder className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('folder')}</span>
                            </Button>
                                    
                        </div>
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-2xl">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer hover:scale-105 ${
                                            activeTab === tab.id
                                                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white transform scale-105'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                                        }`}
                                    >
                                        <span className="transition-transform duration-200 ease-in-out">{tab.icon}</span>
                                        <span className="transition-all duration-200 ease-in-out">{tab.label}</span>
                                        {tab.hasContent && (
                                            <div className={`w-2 h-2 ${tab.color} rounded-full transition-all duration-200 ease-in-out`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {renderTabContent()}
                        </div>
                    </Card>
                </div>

            {/* Folder Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-2">
                            <Folder className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">{t('selectFolder')}</h2>
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="folder-select" className="text-sm font-medium">
                                {t('folder')}
                            </label>
                            <select
                                id="folder-select"
                                value={selectedFolder || ''}
                                onChange={(e) => setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">{t('noFolder')}</option>
                                {folders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFolderModalOpen(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleSaveFolder}>
                                {t('save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DocumentViewer;