import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useCreateNote } from "@/hooks/use-create-note";
import type { Folder } from "@/types";
import languages from "@/utils/languages.json";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
interface WebLinkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: Folder[];
}

interface VideoInfo {
    duration: number;
    title: string;
    valid: boolean;
}

export function WebLinkModal({ open, onOpenChange, folders }: WebLinkModalProps) {
    const [webLink, setWebLink] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>("autodetect");
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { createNote, isUploading } = useCreateNote();

    const MAX_DURATION_HOURS = 1;
    const MAX_DURATION_SECONDS = MAX_DURATION_HOURS * 60 * 60;

    // Extract YouTube video ID from URL
    const extractVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
            /youtube\.com\/embed\/([\w-]+)/,
            /youtube\.com\/v\/([\w-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    // Validate YouTube video duration
    const validateVideoDuration = async (url: string) => {
        const videoId = extractVideoId(url);
        if (!videoId) {
            setValidationError('Invalid YouTube URL');
            setVideoInfo(null);
            return;
        }

        setIsValidating(true);
        setValidationError(null);
        
        try {
            // Use YouTube Data API to get video duration
            // You'll need to add your YouTube API key to your .env file
            const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            if (!apiKey) {
                throw new Error('YouTube API key not configured');
            }

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch video information');
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                throw new Error('Video not found');
            }
            
            const video = data.items[0];
            const duration = parseDuration(video.contentDetails.duration);
            const title = video.snippet.title;
            
            const isValid = duration <= MAX_DURATION_SECONDS;
            
            setVideoInfo({
                duration,
                title,
                valid: isValid
            });
            
            if (!isValid) {
                setValidationError(`Video duration (${formatDuration(duration)}) exceeds the maximum limit of ${MAX_DURATION_HOURS} hour`);
            }
        } catch (error) {
            console.error('Video validation error:', error);
            setValidationError('Failed to validate video. Please check the URL and try again.');
            setVideoInfo(null);
        } finally {
            setIsValidating(false);
        }
    };

    // Parse ISO 8601 duration format (PT1H2M3S) to seconds
    const parseDuration = (duration: string): number => {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);
        
        return hours * 3600 + minutes * 60 + seconds;
    };

    // Format seconds to human-readable duration
    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // Validate URL when it changes
    useEffect(() => {
        if (webLink && extractVideoId(webLink)) {
            const timeoutId = setTimeout(() => {
                validateVideoDuration(webLink);
            }, 1000); // Debounce validation
            
            return () => clearTimeout(timeoutId);
        } else {
            setVideoInfo(null);
            setValidationError(null);
        }
    }, [webLink]);

    const handleSubmit = async () => {
        if (!webLink || !videoInfo?.valid) return;

        const success = await createNote('weblink', {
            folder_id: selectedFolder,
            link: webLink,
            language: selectedLanguage
        });

        if (success && success.id) {
            setWebLink('');
            setSelectedFolder('');
            setSelectedLanguage('autodetect');
            setVideoInfo(null);
            setValidationError(null);
            onOpenChange(false, true, success.id);
        } else if (success === null) {
            onOpenChange(false, false);
        }
    };

    const isSubmitDisabled = !webLink || isUploading || isValidating || !videoInfo?.valid || !!validationError;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Add from Youtube</DialogTitle>
                    <DialogDescription>
                        Create a new note from a youtube video (max {MAX_DURATION_HOURS} hour)
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="web-link">URL</Label>
                        <Input
                            id="web-link"
                            value={webLink}
                            onChange={(e) => setWebLink(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                        />
                        
                        {/* Validation Status */}
                        {isValidating && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Validating video...
                            </div>
                        )}
                        
                        {/* Video Info */}
                        {videoInfo && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800 dark:text-green-200">
                                        Duration: {formatDuration(videoInfo.duration)}
                                    </span>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1 truncate">
                                    {videoInfo.title}
                                </p>
                            </div>
                        )}
                        
                        {/* Validation Error */}
                        {validationError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {validationError}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="folder">Folder (optional)</Label>
                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                            <SelectContent>
                                {folders.map((folder) => (
                                    <SelectItem key={folder.id} value={folder.id.toString()}>
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                    >
                        {isUploading ? 'Creating...' : isValidating ? 'Validating...' : 'Create Note'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}