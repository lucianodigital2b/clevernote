import { router, Head, usePage } from '@inertiajs/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Share, MoreHorizontal, Maximize2, X, ArrowLeft, Save, Clock, CheckCircle2, Folder, Trash2, Sparkles, Brain, Map, FileText, Loader2, ChevronRight, Layers, Copy, Grid3X3, ExternalLink, Play, Eye, Mic } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProcessingState } from '@/components/ui/processing-state';
import { LoadingModal } from '@/components/ui/loading-modal';
import { Note } from '@/types';
import { toastConfig } from '@/lib/toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import { ValidationErrors } from '@/components/validation-errors';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapToolbar from '@/components/tiptaptoolbar';
// import { SectionBlock } from '@/extensions/SectionBlock';
import DragHandle  from '@/extensions/DragHandle';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MathExtension } from "@aarkue/tiptap-math-extension";
import "katex/dist/katex.min.css";
import Image from '@tiptap/extension-image'
import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { Feedback } from './dialogs/feedback';
import  DocumentViewer  from '@/components/ui/document-viewer';

export default function Edit({ note }: { note: Note }) {
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
    const [feedbackReason, setFeedbackReason] = useState('');
    const [deleteRelatedItems, setDeleteRelatedItems] = useState(false);


    const { t } = useTranslation();
    const { errors } = usePage().props;
    
    // Add state for failed status
    const [isFailed, setIsFailed] = useState(note.status === 'failed');
    const [isProcessing, setIsProcessing] = useState(note.status === 'processing');
    const [currentNote, setCurrentNote] = useState(note);
    
    // Sync currentNote with note prop when it changes
    useEffect(() => {
        setCurrentNote(note);
        // Also sync podcastError state
        setPodcastError(
            note.podcast_status === 'failed' ? note.podcast_failure_reason || 'Podcast generation failed' : null
        );
    }, [note]);
    
    // Word count utility function
    const getWordCount = (htmlContent: string): number => {
        if (!htmlContent) return 0;
        
        // Create a temporary div to strip HTML tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Split by whitespace and filter out empty strings
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    };
    


  
  const handleSubmitFeedback = async (isPositive: boolean, reason?: string) => {
    
    try {
        const res = await axios.post(`/feedback`, {
            feedbackable_type: 'note',
            feedbackable_id: note.id,
            is_positive: isPositive,
            reason: isPositive ? null : (reason || feedbackReason),
        })

        
        setFeedbackModalOpen(false);
        setShowDetailedFeedback(false);
        setFeedbackReason('');

        toastConfig.success('Thanks for the feedback');

    } catch (error) {
        console.error('Error submitting feedback:', error);
        toastConfig.error('Failed to submit feedback');
    }

  };

  const handleUpdate = () => {
        router.patch(`/notes/${note.id}`, {
            content,
            folder_id: selectedFolder,
            is_public: isPublic,
            _method: 'PUT'
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toastConfig.success("Note updated successfully");
            },
            onError: (errors) => {
                console.log(errors);
                
                toastConfig.error("Failed to update note");
            }
        });
    };
    
    const handleSaveFolder = () => {
        setIsFolderModalOpen(false);
        handleUpdate();
    };

    const handleCopyPublicLink = async () => {
        if (!note.uuid) {
            toastConfig.error('Note UUID not available');
            return;
        }
        
        const publicUrl = `${window.location.origin}/notes/${note.uuid}/public`;
        
        try {
            await navigator.clipboard.writeText(publicUrl);
            toastConfig.success('Public link copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toastConfig.error('Failed to copy link to clipboard');
        }
     };

    // Add this function near your other handlers
    const handleRetryProcessing = async () => {
        try {
            setIsFailed(false);
            
            const response = await axios.post(`/notes/${note.id}/retry`);
            
            if (response.data.message) {
                toastConfig.success('Processing retry initiated');
            }
        } catch (error) {
            console.error('Error retrying processing:', error);
            setIsFailed(true);
            toastConfig.error('Failed to retry processing');
        }
    };

    // Add this new state
    const [isActionsVisible, setIsActionsVisible] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [content, setContent] = useState(currentNote.content);
    
    // Document viewer state
    const [isDocumentViewerFullscreen, setIsDocumentViewerFullscreen] = useState(false);
    const [documentUrl, setDocumentUrl] = useState<string | null>(() => {
        // Find the first PDF or PPT file from the note's media collection
        const documentFile = currentNote.media?.find(file => 
            file.mime_type === 'application/pdf' || 
            file.mime_type === 'application/vnd.ms-powerpoint' ||
            file.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
        
        return documentFile?.original_url || null;
    });

    // Get document file info for DocumentViewer props
    const documentFile = useMemo(() => {
        return currentNote.media?.find(file => 
            file.mime_type === 'application/pdf' || 
            file.mime_type === 'application/vnd.ms-powerpoint' ||
            file.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
    }, [currentNote.media]);

    const documentFileName = documentFile?.name || 'document';
    const documentFileType = documentFile?.mime_type === 'application/pdf' ? 'pdf' : 'ppt';

    // Calculate word count from current content using useMemo for real-time updates
    const wordCount = useMemo(() => {
        return getWordCount(content || currentNote.content);
    }, [content, currentNote.content]);

    const debouncedContent = useDebounce(content, 1000); // Debounce content by 1 second

    // console.log(wordCount);
    
    // Add state for the flashcard modal
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

    // Update handler to show/hide modal
    const handleCreateFlashcards = async () => {
        setIsFlashcardModalOpen(true);
        try {
            // If no existing flashcard set, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-flashcards`);
            if (response.data && response.data.flashcardSetId) {
                const flashcardSetId = response.data.flashcardSetId;
                
                // Start polling for flashcard set status
                const intervalId = setInterval(async () => {
                    try {
                        const flashcardResponse = await axios.get(`/flashcard-sets/${flashcardSetId}`);
                        const flashcardData = flashcardResponse.data.flashcardSet;
                        
                        if (flashcardData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsFlashcardModalOpen(false);
                            toastConfig.success("Flashcards generated successfully");
                            // Refresh the page to show updated flashcards
                            window.location.reload();
                            
                        } else if (flashcardData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsFlashcardModalOpen(false);
                            toastConfig.error("Flashcard generation failed");
                        }
                        // Continue polling if status is 'generating' or 'pending'
                    } catch (error) {
                        clearInterval(intervalId);
                        setIsFlashcardModalOpen(false);
                        toastConfig.error("Failed to check flashcard generation status");
                    }
                }, 5000); // Poll every 5 seconds
            }
        } catch (error) {
            setIsFlashcardModalOpen(false);
            toastConfig.error("Failed to start flashcard generation");
        }
    };


    // Add new state for quiz generation
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(note.folder_id || null);
    const [folders, setFolders] = useState<Array<{id: number; name: string}>>([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(note.is_public || false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    
    useEffect(() => {
        if (isFolderModalOpen) {
            
            axios.get('/folders').then(response => {
                console.log(response.data);
                setFolders(response.data);
            }).catch(error => {
                console.error('Error fetching folders:', error);
            });
        }
    }, [isFolderModalOpen]);



    const handleCreateQuizz = async () => {
        setIsQuizModalOpen(true);
        try {
            // If no existing quiz, create a new one
            const response = await axios.post(`/quizzes/generate-from-note/${note.id}`);
            if (response.data && response.data.quiz_id) {
                const quizId = response.data.quiz_id;
                
                // Start polling for quiz status
                const intervalId = setInterval(async () => {
                    try {
                        const quizResponse = await axios.get(`/api/quizzes/${quizId}`);
                        const quizData = quizResponse.data.quiz;
                        
                        if (quizData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsQuizModalOpen(false);
                            toastConfig.success("Quiz generated successfully");
                            // Refresh the page to show updated quiz
                            window.location.reload();
                            
                        } else if (quizData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsQuizModalOpen(false);
                            toastConfig.error("Quiz generation failed");
                        }
                        // Continue polling if status is 'generating'
                    } catch (error) {
                        console.log(error);
                        
                        clearInterval(intervalId);
                        setIsQuizModalOpen(false);
                        toastConfig.error("Failed to check quiz generation status");
                    }
                }, 2000); // Poll every 2 seconds
                
               
            }
        } catch (error) {
            setIsQuizModalOpen(false);
            toastConfig.error("Failed to start quiz generation");
        }
    };

    // Add new state for mindmap loading modal
    const [isMindmapLoading, setIsMindmapLoading] = useState(false);

    const handleCreateMindmap = async () => {
        setIsMindmapLoading(true);
        try {
            // If no existing mindmap, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-mindmap`);
            if (response.data && response.data.mindmap) {
                const mindmapId = response.data.mindmap.id;
                
                // Start polling for mindmap status
                const intervalId = setInterval(async () => {
                    try {
                        const mindmapResponse = await axios.get(`/api/mindmaps/${mindmapId}/status`);
                        const mindmapData = mindmapResponse.data;
                        
                        if (mindmapData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsMindmapLoading(false);
                            toastConfig.success("Mindmap generated successfully");
                            // Refresh the page to show updated mindmap
                            window.location.reload();
                            
                        } else if (mindmapData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsMindmapLoading(false);
                            toastConfig.error("Mindmap generation failed");
                        }
                        // Continue polling if status is 'generating' or 'pending'
                    } catch (error) {
                        console.log(error)
                        clearInterval(intervalId);
                        setIsMindmapLoading(false);
                        toastConfig.error("Failed to check mindmap generation status");
                    }
                }, 3000); // Poll every 3 seconds
            }
        } catch (error) {
            setIsMindmapLoading(false);
            toastConfig.error("Failed to generate mindmap");
        }
    };

    // Add new state for crossword loading modal
    const [isCrosswordLoading, setIsCrosswordLoading] = useState(false);

    // Add new state for podcast loading modal
    const [isPodcastLoading, setIsPodcastLoading] = useState(false);
    const [podcastError, setPodcastError] = useState<string | null>(
        note.podcast_status === 'failed' ? note.podcast_failure_reason || 'Podcast generation failed' : null
    );
    
    // Add ref to store podcast polling interval
    const podcastPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Add ref for the podcast audio player
    const podcastPlayerRef = useRef<any>(null);
    
    // Add state for podcast configuration modal
    const [isPodcastConfigOpen, setIsPodcastConfigOpen] = useState(false);
    const [selectedHostVoice, setSelectedHostVoice] = useState('en-US-natalie');
    const [selectedGuestVoice, setSelectedGuestVoice] = useState('en-US-cooper');
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');
    const [podcastMode, setPodcastMode] = useState<'single' | 'dual'>('dual');
    
    // Murf voices organized by language
    const murfVoices = {
        'en-US': [
            { id: 'en-US-natalie', name: 'Natalie (Female, US)' },
            { id: 'en-US-cooper', name: 'Cooper (Male, US)' },
            { id: 'en-US-imani', name: 'Imani (Female, US)' },
            { id: 'en-US-marcus', name: 'Marcus (Male, US)' },
            { id: 'en-US-sarah', name: 'Sarah (Female, US)' },
            { id: 'en-US-james', name: 'James (Male, US)' },
            { id: 'en-US-lily', name: 'Lily (Female, US)' },
            { id: 'en-US-david', name: 'David (Male, US)' }
        ],
        'en-GB': [
            { id: 'en-UK-hazel', name: 'Hazel (Female, British)' },
            { id: 'en-UK-oliver', name: 'Oliver (Male, British)' },
            { id: 'en-UK-charlotte', name: 'Charlotte (Female, British)' },
            { id: 'en-UK-william', name: 'William (Male, British)' }
        ],
        'en-AU': [
            { id: 'en-AU-ruby', name: 'Ruby (Female, Australian)' },
            { id: 'en-AU-jack', name: 'Jack (Male, Australian)' }
        ],
        'es-ES': [
            { id: 'es-ES-sofia', name: 'Sofia (Female, Spanish)' },
            { id: 'es-ES-diego', name: 'Diego (Male, Spanish)' },
            { id: 'es-ES-lucia', name: 'Lucia (Female, Spanish)' }
        ],
        'es-MX': [
            { id: 'es-MX-isabella', name: 'Isabella (Female, Mexican)' },
            { id: 'es-MX-carlos', name: 'Carlos (Male, Mexican)' }
        ],
        'pt-BR': [
            { id: 'pt-BR-ana', name: 'Ana (Female, Brazilian)' },
            { id: 'pt-BR-pedro', name: 'Pedro (Male, Brazilian)' },
            { id: 'pt-BR-maria', name: 'Maria (Female, Brazilian)' }
        ],
        'fr-FR': [
            { id: 'fr-FR-claire', name: 'Claire (Female, French)' },
            { id: 'fr-FR-antoine', name: 'Antoine (Male, French)' },
            { id: 'fr-FR-camille', name: 'Camille (Female, French)' }
        ],
        'de-DE': [
            { id: 'de-DE-anna', name: 'Anna (Female, German)' },
            { id: 'de-DE-max', name: 'Max (Male, German)' },
            { id: 'de-DE-emma', name: 'Emma (Female, German)' }
        ],
        'it-IT': [
            { id: 'it-IT-giulia', name: 'Giulia (Female, Italian)' },
            { id: 'it-IT-marco', name: 'Marco (Male, Italian)' },
            { id: 'it-IT-francesca', name: 'Francesca (Female, Italian)' }
        ],
        'ja-JP': [
            { id: 'ja-JP-yuki', name: 'Yuki (Female, Japanese)' },
            { id: 'ja-JP-hiroshi', name: 'Hiroshi (Male, Japanese)' }
        ],
        'ko-KR': [
            { id: 'ko-KR-soyeon', name: 'Soyeon (Female, Korean)' },
            { id: 'ko-KR-minho', name: 'Minho (Male, Korean)' }
        ],
        'zh-CN': [
            { id: 'zh-CN-mei', name: 'Mei (Female, Chinese)' },
            { id: 'zh-CN-wei', name: 'Wei (Male, Chinese)' }
        ]
    };
    
    const languages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'en-AU', name: 'English (Australia)' },
        { code: 'es-ES', name: 'Spanish (Spain)' },
        { code: 'es-MX', name: 'Spanish (Mexico)' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)' },
        { code: 'fr-FR', name: 'French' },
        { code: 'de-DE', name: 'German' },
        { code: 'it-IT', name: 'Italian' },
        { code: 'ja-JP', name: 'Japanese' },
        { code: 'ko-KR', name: 'Korean' },
        { code: 'zh-CN', name: 'Chinese (Mandarin)' }
    ];
    
    // Get available voices for selected language
    const availableVoices = murfVoices[selectedLanguage] || [];
    
    // Update selected voices when language changes
    useEffect(() => {
        const voices = murfVoices[selectedLanguage] || [];
        if (voices.length > 0) {
            // Set default host voice (prefer female voices)
            const femaleVoices = voices.filter(v => v.name.includes('Female'));
            const maleVoices = voices.filter(v => v.name.includes('Male'));
            
            if (!voices.find(v => v.id === selectedHostVoice)) {
                setSelectedHostVoice(femaleVoices.length > 0 ? femaleVoices[0].id : voices[0].id);
            }
            
            if (!voices.find(v => v.id === selectedGuestVoice)) {
                setSelectedGuestVoice(maleVoices.length > 0 ? maleVoices[0].id : (voices[1] || voices[0]).id);
            }
        }
    }, [selectedLanguage, selectedHostVoice, selectedGuestVoice]);

    const handleCreateCrossword = async () => {
        setIsCrosswordLoading(true);
        try {
            // Check if crossword already exists in preloaded data
            if (note.crosswords && note.crosswords.length > 0) {
                setIsCrosswordLoading(false);
                // Get the last created crossword
                const lastCrossword = note.crosswords[note.crosswords.length - 1];
                router.visit(`/crosswords/${lastCrossword.id}`);
                return;
            }

            // If no existing crossword, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-crossword`);
            if (response.data && response.data.crossword_id) {
                const crosswordId = response.data.crossword_id;
                
                // Start polling for crossword status
                const intervalId = setInterval(async () => {
                    try {
                        const crosswordResponse = await axios.get(`/crosswords/${crosswordId}/status`);
                        const crosswordData = crosswordResponse.data;
                        
                        if (crosswordData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsCrosswordLoading(false);
                            router.visit(`/crosswords/${crosswordId}`);
                            
                        } else if (crosswordData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsCrosswordLoading(false);
                            toastConfig.error("Crossword generation failed: " + (crosswordData.failure_reason || "Unknown error"));
                        }
                        // Continue polling if status is 'generating' or 'pending'
                    } catch (error) {
                        console.error('Error checking crossword status:', error);
                        clearInterval(intervalId);
                        setIsCrosswordLoading(false);
                        toastConfig.error("Failed to check crossword generation status");
                    }
                }, 3000); // Poll every 3 seconds
                
            }
        } catch (error) {
            console.error('Error creating crossword:', error);
            setIsCrosswordLoading(false);
            toastConfig.error("Failed to start crossword generation");
        }
    };

    const handlePlayPodcast = () => {
        // Scroll to the podcast section smoothly
        const podcastSection = document.querySelector('[data-podcast-section]');
        if (podcastSection) {
            podcastSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Try to start playing the audio after scrolling
            setTimeout(() => {
                if (podcastPlayerRef.current && podcastPlayerRef.current.audio && podcastPlayerRef.current.audio.current) {
                    try {
                        podcastPlayerRef.current.audio.current.play();
                        toastConfig.success("🎧 Playing your podcast!");
                    } catch (error) {
                        console.log('Auto-play prevented by browser, user interaction required');
                    }
                } else {
                }
            }, 800); // Increased delay to ensure smooth scrolling completes
        } else {
            // Fallback: scroll to top of page where podcast section should be
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGeneratePodcast = () => {
        // If podcast is already processing, just show status
        if (currentNote.podcast_status === 'processing') {
            toastConfig.info("Podcast generation is already in progress");
            return;
        }
        
        // Open configuration modal
        setIsPodcastConfigOpen(true);
    };
    
    const handleConfirmPodcastGeneration = async () => {
        setIsPodcastConfigOpen(false);
        setIsPodcastLoading(true);
        setPodcastError(null); // Clear any previous errors
        
        // Clear any existing polling interval
        if (podcastPollingIntervalRef.current) {
            clearInterval(podcastPollingIntervalRef.current);
            podcastPollingIntervalRef.current = null;
        }
        
        try {
            // Generate new podcast with selected voices and language
            const podcastData = {
                language_code: selectedLanguage,
                add_intro: true,
                add_conclusion: true,
                use_ssml: true,
                ...(podcastMode === 'dual' ? {
                    host_voice: selectedHostVoice,
                    guest_voice: selectedGuestVoice,
                    dual_voice: true
                } : {
                    voice_id: selectedHostVoice
                })
            };
            
            const response = await axios.post(`/notes/${note.id}/generate-podcast`, podcastData);
            
            if (response.data && response.data.message) {
                // Start polling for podcast status
                podcastPollingIntervalRef.current = setInterval(async () => {
                    try {
                        const podcastResponse = await axios.get(`/notes/${note.id}/podcast-status`);
                        const podcastData = podcastResponse.data;
                        
                        if (podcastData.podcast_status === 'completed') {
                            if (podcastPollingIntervalRef.current) {
                                clearInterval(podcastPollingIntervalRef.current);
                                podcastPollingIntervalRef.current = null;
                            }
                            setIsPodcastLoading(false);
                            setPodcastError(null);
                            setCurrentNote(prev => ({
                                ...prev,
                                podcast_status: 'completed',
                                podcast_file_path: podcastData.podcast_file_path,
                                podcast_url: podcastData.podcast_url,
                                podcast_duration: podcastData.podcast_duration,
                                podcast_file_size: podcastData.podcast_file_size,
                                podcast_generated_at: podcastData.podcast_generated_at
                            }));
                            toastConfig.success("Podcast generated successfully!");
                            // Refresh the page to show updated podcast
                            window.location.reload();
                            
                        } else if (podcastData.podcast_status === 'failed') {
                            if (podcastPollingIntervalRef.current) {
                                clearInterval(podcastPollingIntervalRef.current);
                                podcastPollingIntervalRef.current = null;
                            }
                            setIsPodcastLoading(false);
                            const errorMessage = podcastData.podcast_failure_reason || 'Unknown error';
                            setPodcastError(errorMessage);
                            toastConfig.error(`Podcast generation failed: ${errorMessage}`);
                        }
                        // Continue polling if status is 'processing' or 'pending'
                    } catch (error) {
                        console.error('Error checking podcast status:', error);
                        if (podcastPollingIntervalRef.current) {
                            clearInterval(podcastPollingIntervalRef.current);
                            podcastPollingIntervalRef.current = null;
                        }
                        setIsPodcastLoading(false);
                        const errorMessage = "Failed to check podcast generation status";
                        setPodcastError(errorMessage);
                        toastConfig.error(errorMessage);
                    }
                }, 5000); // Poll every 5 seconds
                
                toastConfig.success("Podcast generation started");
            }
        } catch (error) {
            setIsPodcastLoading(false);
            console.error('Error generating podcast:', error);
            const errorMessage = error.response?.data?.message || "Failed to start podcast generation";
            setPodcastError(errorMessage);
            toastConfig.error(errorMessage);
        }
    };


    const actions = [
        { 
            icon: Layers, 
            label: note.flashcard_sets && note.flashcard_sets.length > 0 ? t('review_flashcards') : t('create_flashcards'), 
            description: note.flashcard_sets && note.flashcard_sets.length > 0 ? t('review_study_cards') : t('generate_study_cards'),
            action: handleCreateFlashcards,
            color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-900 dark:text-white dark:border-transparent',
            loading: isFlashcardModalOpen
        },
        { 
            icon: Brain, 
            label: note.quizzes && note.quizzes.length > 0 ? t('review_quiz') : t('create_quiz'), 
            description: note.quizzes && note.quizzes.length > 0 ? t('review_knowledge_test') : t('test_knowledge_ai'),
            action: handleCreateQuizz,
            color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:text-white dark:border-transparent',
            loading: isQuizModalOpen
        },
        { 
            icon: Map, 
            label: note.mindmaps && note.mindmaps.length > 0 ? t('review_mindmap') : t('generate_mindmap'), 
            description: note.mindmaps && note.mindmaps.length > 0 ? t('review_concepts') : t('visualize_concepts'),
            action: handleCreateMindmap,
            color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:text-white dark:border-transparent',
            loading: isMindmapLoading
        },
        // Only show podcast action if not completed - when completed, the audio player is always visible
        ...(currentNote.podcast_status !== 'completed' ? [{ 
            icon: Mic, 
            label: 'Generate Podcast', 
            description: 'Convert note to audio podcast',
            action: handleGeneratePodcast,
            color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:text-white dark:border-transparent',
            loading: isPodcastLoading || currentNote.podcast_status === 'processing'
        }] : []),
        // { 
        //     icon: Grid3X3, 
        //     label: note.crosswords && note.crosswords.length > 0 ? t('review_crossword') : t('create_crossword'), 
        //     description: note.crosswords && note.crosswords.length > 0 ? t('review_crossword_puzzle') : t('generate_crossword_puzzle'),
        //     action: handleCreateCrossword,
        //     color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:text-white dark:border-transparent',
        //     loading: isCrosswordLoading
        // },
    ];

    
    console.log(currentNote);
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            DragHandle.configure({
                dragHandlePosition: "follow",
                dragHandleSpeed: 1
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
            }),
            MathExtension.configure({ evaluation: true, katexOptions: { macros: { "\\B": "\\mathbb{B}" } }, delimiters: "dollar" }),
        ],
        content: currentNote.content || '',
        editorProps: {
            handlePaste: (view, event, slice) => {
              const file = event.clipboardData?.files?.[0]
              if (file) uploadImage(file)
              return false
            },
            handleDrop: (view, event) => {
              const file = event.dataTransfer?.files?.[0]
              if (file) uploadImage(file)
              return false
            },
        },
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });

    // Sync editor content when currentNote changes (after processing)
    useEffect(() => {
        if (editor) {
            // Always update editor content when currentNote changes, especially after processing
            const newContent = currentNote.content || '';
            console.log('Syncing editor content:', { newContent, currentNoteStatus: currentNote.status });
            editor.commands.setContent(newContent);
            setContent(newContent);
        }
    }, [currentNote.content, currentNote.status, editor]);

    async function uploadImage(file : any) {
        const formData = new FormData()
        formData.append('file', file)
      
        const noteId = note.id;
    
        const res = await axios.post(`/api/notes/${noteId}/media`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        const { url } = await res.data;
        editor?.chain().focus().setImage({ src: url }).run()
    }

    
    // Add useEffect for note status polling
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let timeoutId: NodeJS.Timeout;
        
        if (isProcessing) {
            const startTime = Date.now();
            const TIMEOUT_DURATION = 180000; // 3 minutes in milliseconds
            
            intervalId = setInterval(async () => {
                try {
                    // Check if 3 minutes have passed
                    if (Date.now() - startTime >= TIMEOUT_DURATION) {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        setIsFailed(true);
                        
                        // Update note status to failed on the server
                        try {
                            await axios.patch(`/api/notes/${note.id}/status`, {
                                status: 'failed',
                                failure_reason: 'Processing timeout after 3 minutes'
                            });
                        } catch (updateError) {
                            console.error('Error updating note status to failed:', updateError);
                        }
                        
                        toastConfig.error("Note processing timed out and has been marked as failed");
                        return;
                    }
                    
                    const response = await axios.get(`/api/notes/${note.id}`);
                    const noteData = response.data;
                    
                    console.log('Polling result:', { status: noteData.status, hasContent: !!noteData.content });
                    
                    if (noteData.status === 'processed') {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        setIsFailed(false); // Ensure failed state is cleared
                        setCurrentNote(noteData);
                        
                        // Update documentUrl when note is processed and has media
                        const documentFile = noteData.media?.find(file => 
                            file.mime_type === 'application/pdf' || 
                            file.mime_type === 'application/vnd.ms-powerpoint' ||
                            file.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                        );
                        
                        if (documentFile) {
                            const baseUrl = window.location.origin;
                            const originalUrl = documentFile.original_url;
                            
                            // Check if we're in development environment
                            const isDevelopment = window.location.hostname === 'clevernote.test' || 
                                                 window.location.hostname === 'localhost' ||
                                                 window.location.hostname === '127.0.0.1';
                            
                            let newDocumentUrl = null;
                            
                            // If original_url is already a full URL, handle domain replacement for development
                            if (originalUrl && (originalUrl.startsWith('http://') || originalUrl.startsWith('https://'))) {
                                if (isDevelopment && originalUrl.includes('media.getclevernote.app')) {
                                    // Replace production domain with development domain
                                    newDocumentUrl = originalUrl.replace('media.getclevernote.app', 'pub-5727786edd04b3a823b42784888a51d.r2.dev');
                                } else {
                                    newDocumentUrl = originalUrl;
                                }
                            }
                            // If it's a relative path, construct the full URL
                            else if (originalUrl && originalUrl.startsWith('/')) {
                                newDocumentUrl = `${baseUrl}${originalUrl}`;
                            }
                            // If it's just a filename or path, and we're in development, use R2 dev domain
                            else if (isDevelopment && originalUrl) {
                                newDocumentUrl = `https://pub-5727786edd04b3a823b42784888a51d.r2.dev/${originalUrl}`;
                            }
                            // Fallback: construct storage path for production
                            else if (originalUrl) {
                                newDocumentUrl = `${baseUrl}/storage/${originalUrl}`;
                            }
                            
                            if (newDocumentUrl) {
                                setDocumentUrl(newDocumentUrl);
                            }
                        }
                        
                        // Open feedback modal after processing is complete
                        setTimeout(() => {
                            setFeedbackModalOpen(true);
                        }, 1000); // Small delay to let user see the success message
                        
                    } else if (noteData.status === 'failed') {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        setIsFailed(true);
                        setCurrentNote(noteData);
                        toastConfig.error("Note processing failed");
                    }
                    // Continue polling if status is still 'processing'
                } catch (error) {
                    console.error('Error checking note status:', error);
                    // Don't clear interval on error, continue polling
                }
            }, 3000); // Poll every 3 seconds
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isProcessing, note.id]);

    // Add useEffect for autosave
    useEffect(() => {
        // Only save if the editor is ready, content has changed (debounced), and not currently processing
        if (editor && debouncedContent !== currentNote.content && debouncedContent && !isProcessing) {
            router.patch(`/notes/${note.id}`, {
                content: debouncedContent,
                folder_id: selectedFolder,
                _method: 'PUT'
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Silent save - no toast notification
                },
                onError: (errors) => {
                    console.log(errors);
                    toastConfig.error("Failed to update note");
                }
            });
        }
    }, [debouncedContent, editor, currentNote.content, isProcessing, note.id, selectedFolder]);

    // Cleanup podcast polling interval on component unmount
    useEffect(() => {
        return () => {
            if (podcastPollingIntervalRef.current) {
                clearInterval(podcastPollingIntervalRef.current);
                podcastPollingIntervalRef.current = null;
            }
        };
    }, []);

    const handleDelete = () => {
        router.delete(`/notes/${note.id}`, {
            data: {
                delete_related_items: deleteRelatedItems
            },
            onSuccess: () => {
                toastConfig.success('Note deleted successfully');
                router.visit('/notes');
            },
            onError: () => {
                toastConfig.error('Failed to delete note');
            },
        });
    };


    return (
        <AppLayout>
            {/* Feedback Modal - Bottom Right Corner */}
            {feedbackModalOpen && (
                <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-black/5 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 max-w-sm">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('feedback_modal_title')}</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFeedbackModalOpen(false)}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubmitFeedback(true)}
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-600/5"
                            >
                                <ThumbsUp className="h-4 w-4" />
                                {t('yes')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFeedbackModalOpen(false);
                                    // Open the detailed feedback modal for negative feedback
                                    setShowDetailedFeedback(true);
                                }}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-600/5"
                            >
                                <ThumbsDown className="h-4 w-4" />
                                {t('no')}
                            </Button>
                        </div>
                        
                        {/* Optional: Show reason input for negative feedback */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('feedback_modal_subtitle')}
                        </div>
                    </div>
                </div>
            )}

            <Head title={`${currentNote.title}`} />
            
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t('select')}</h3>
                        <select 
                            className="w-full p-2 border rounded"
                            value={selectedFolder || ''}
                            onChange={(e) => setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)}
                        >
                            <option value="">No folder</option>
                            {folders?.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleSaveFolder}>
                                {t('save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <div className="flex h-full bg-neutral-50/50 dark:bg-neutral-900/50">
                {/* Left Side - DocumentViewer */}
                <div className="w-full p-4">
                    <DocumentViewer
                        fileUrl={documentUrl}
                        fileName={documentFileName}
                        fileType={documentFileType}
                        isFullscreen={isDocumentViewerFullscreen}
                        onToggleFullscreen={() => setIsDocumentViewerFullscreen(!isDocumentViewerFullscreen)}
                        note={currentNote}
                        isLoading={isProcessing}
                        onGenerateQuiz={() => {
                            handleCreateQuizz();
                        }}
                        onGenerateFlashcards={() => {
                            handleCreateFlashcards();
                        }}
                        onGenerateMindmap={() => {
                            handleCreateMindmap();
                        }}
                        onGeneratePodcast={() => {
                            handleGeneratePodcast();
                        }}
                        onFolderChange={(folderId) => {
                            setSelectedFolder(folderId);
                            handleSaveFolder();
                        }}
                        className="h-[calc(100vh-2rem)]"
                    />
                </div>
                

            </div>
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <p>This action cannot be undone. This will permanently delete your note.</p>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="deleteRelated"
                                    checked={deleteRelatedItems}
                                    onChange={(e) => setDeleteRelatedItems(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="deleteRelated" className="text-sm text-gray-600 dark:text-gray-400">
                                    Also delete related items (flashcards, quizzes)
                                </label>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Loading Modals */}
            <LoadingModal 
                open={isFlashcardModalOpen} 
                type="flashcard" 
                title={t('loading_modal_creating_flashcards')}
                description={t('loading_modal_flashcard_description')}
            />
            <LoadingModal 
                open={isQuizModalOpen} 
                type="quiz" 
                title={t('loading_modal_generating_quiz')}
                description={t('loading_modal_quiz_description')}
            />
            <LoadingModal 
                open={isMindmapLoading} 
                type="mindmap" 
                title={t('loading_modal_building_mindmap')}
                description={t('loading_modal_mindmap_description')}
                onOpenChange={setIsMindmapLoading} 
            />

            {/* Podcast Configuration Modal */}
            <Dialog open={isPodcastConfigOpen} onOpenChange={setIsPodcastConfigOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Configure Podcast Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Podcast Style</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={podcastMode === 'single' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPodcastMode('single')}
                                    className="flex-1"
                                >
                                    Single Voice
                                </Button>
                                <Button
                                    type="button"
                                    variant={podcastMode === 'dual' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPodcastMode('dual')}
                                    className="flex-1"
                                >
                                    Host & Guest
                                </Button>
                            </div>
                        </div>

                        {podcastMode === 'dual' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="hostVoice">Host Voice</Label>
                                    <Select value={selectedHostVoice} onValueChange={setSelectedHostVoice}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select host voice" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableVoices.map((voice) => (
                                                <SelectItem key={voice.id} value={voice.id}>
                                                    {voice.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guestVoice">Guest Voice</Label>
                                    <Select value={selectedGuestVoice} onValueChange={setSelectedGuestVoice}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select guest voice" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableVoices.map((voice) => (
                                                <SelectItem key={voice.id} value={voice.id}>
                                                    {voice.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="voice">Voice</Label>
                                <Select value={selectedHostVoice} onValueChange={setSelectedHostVoice}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a voice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableVoices.map((voice) => (
                                            <SelectItem key={voice.id} value={voice.id}>
                                                {voice.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        {podcastMode === 'dual' && (
                            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <Mic className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="font-medium text-blue-900 dark:text-blue-100">Dual-Voice Podcast</p>
                                        <p className="text-blue-700 dark:text-blue-300">Your note will be transformed into a conversation between a host and guest, podcast" in your note's language.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPodcastConfigOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmPodcastGeneration}
                            disabled={!selectedHostVoice || !selectedLanguage || (podcastMode === 'dual' && !selectedGuestVoice)}
                        >
                            Generate Podcast
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detailed Feedback Modal */}
            <Feedback 
                isOpen={showDetailedFeedback} 
                onClose={() => setShowDetailedFeedback(false)}
                onSubmit={(reason) => handleSubmitFeedback(false, reason)}
                feedbackReason={feedbackReason}
                setFeedbackReason={setFeedbackReason}
            />
                  
        </AppLayout>
    )
}
