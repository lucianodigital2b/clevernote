import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Play, Pause, Square, RotateCcw, Clock, Trophy, Target, Timer, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import FocusLeaderboard from '@/components/Focus/FocusLeaderboard';
import FocusHistory from '@/components/Focus/FocusHistory';
import FocusStats from '@/components/Focus/FocusStats';

interface Tag {
    id: number;
    name: string;
}

interface FocusSession {
    id: number;
    tag_id?: number;
    tag?: Tag;
    started_at: string;
    planned_duration_minutes: number;
    actual_duration_minutes?: number;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    pause_intervals?: Array<{
        paused_at: string;
        resumed_at?: string;
    }>;
}

interface TodayStats {
    sessions_completed: number;
    total_focus_time: number;
}

interface Props {
    activeSession: FocusSession | null;
    tags: Tag[];
    todayStats: TodayStats;
}

const TIMER_DURATIONS = [
    { value: 15, label: '15 minutes' },
    { value: 25, label: '25 minutes (Pomodoro)' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
];

export default function FocusIndex({ activeSession: initialSession, tags, todayStats: initialStats }: Props) {
    const { t } = useTranslation();
    const [activeSession, setActiveSession] = useState<FocusSession | null>(initialSession);
    const [todayStats, setTodayStats] = useState<TodayStats>(initialStats);
    const [selectedTagId, setSelectedTagId] = useState<string>('none');
    const [selectedDuration, setSelectedDuration] = useState<number>(25);
    const [sessionNotes, setSessionNotes] = useState<string>('');
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio for notifications
    useEffect(() => {
        audioRef.current = new Audio('/sounds/notification.mp3'); // You'll need to add this sound file
        audioRef.current.volume = 0.5;
    }, []);

    // Timer logic
    useEffect(() => {
        if (activeSession && activeSession.status === 'active') {
            intervalRef.current = setInterval(() => {
                updateTimeRemaining();
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [activeSession]);

    const updateTimeRemaining = () => {
        if (!activeSession) return;

        const startTime = new Date(activeSession.started_at);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Calculate pause time in seconds
        let pauseSeconds = 0;
        if (activeSession.pause_intervals) {
            activeSession.pause_intervals.forEach(interval => {
                const pausedAt = new Date(interval.paused_at);
                const resumedAt = interval.resumed_at ? new Date(interval.resumed_at) : now;
                pauseSeconds += Math.floor((resumedAt.getTime() - pausedAt.getTime()) / 1000);
            });
        }

        const actualElapsedSeconds = elapsedSeconds - pauseSeconds;
        const totalSessionSeconds = activeSession.planned_duration_minutes * 60;
        const remainingSeconds = Math.max(0, totalSessionSeconds - actualElapsedSeconds);
        
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecsOnly = remainingSeconds % 60;
        
        setTimeRemaining(remainingMinutes);
        setSecondsRemaining(remainingSecsOnly);

        // Auto-complete when time is up
        if (remainingSeconds === 0 && activeSession.status === 'active') {
            handleComplete();
            playNotificationSound();
        }
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(console.error);
        }
    };

    const handleCreateTag = async (tagName: string) => {
        try {
            const response = await fetch('/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    name: tagName
                })
            });

            const data = await response.json();
            if (response.ok) {
                const newTag = data.tag;
                setAvailableTags(prev => [...prev, newTag]);
                setSelectedTagId(newTag.id.toString());
                toast.success('Tag created successfully');
            } else {
                toast.error(data.error || 'Failed to create tag');
            }
        } catch (error) {
            toast.error('Failed to create tag');
        }
    };

    const formatTime = (minutes: number, seconds: number = 0): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${mins}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleStart = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/focus/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    tag_id: selectedTagId === "none" ? null : selectedTagId,
                    duration: selectedDuration
                })
            });

            const data = await response.json();
            if (response.ok) {
                setActiveSession(data.session);
                setTimeRemaining(data.session.planned_duration_minutes);
                setSecondsRemaining(0);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to start session');
            }
        } catch (error) {
            toast.error('Failed to start session');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePause = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/focus/pause', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();
            if (response.ok) {
                setActiveSession(data.session);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to pause session');
            }
        } catch (error) {
            toast.error('Failed to pause session');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResume = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/focus/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();
            if (response.ok) {
                setActiveSession(data.session);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to resume session');
            }
        } catch (error) {
            toast.error('Failed to resume session');
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/focus/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    notes: sessionNotes
                })
            });

            const data = await response.json();
            if (response.ok) {
                setActiveSession(null);
                setSessionNotes('');
                setTodayStats(data.stats);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to complete session');
            }
        } catch (error) {
            toast.error('Failed to complete session');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/focus/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();
            if (response.ok) {
                setActiveSession(null);
                setSessionNotes('');
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to cancel session');
            }
        } catch (error) {
            toast.error('Failed to cancel session');
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize time remaining for existing session and start timer
    useEffect(() => {
        if (activeSession) {
            updateTimeRemaining();
            // Start the timer immediately when session becomes active
            if (activeSession.status === 'active') {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                intervalRef.current = setInterval(() => {
                    updateTimeRemaining();
                }, 1000);
            }
        }
    }, [activeSession]);

    // Update page title with timer
    useEffect(() => {
        if (activeSession && activeSession.status === 'active') {
            document.title = `${formatTime(timeRemaining, secondsRemaining)} - Focus Timer`;
        } else {
            document.title = 'Focus Timer';
        }

        // Cleanup on unmount
        return () => {
            document.title = 'Focus Timer';
        };
    }, [timeRemaining, secondsRemaining, activeSession]);

    const getProgressPercentage = (): number => {
        if (!activeSession) return 0;
        const totalSeconds = activeSession.planned_duration_minutes * 60;
        const remainingTotalSeconds = (timeRemaining * 60) + secondsRemaining;
        const elapsed = totalSeconds - remainingTotalSeconds;
        return (elapsed / totalSeconds) * 100;
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Focus Timer',
                    href: '/focus',
                },
            ]}
        >
            <Head title="Focus Timer" />
            
            <div className="py-4 sm:py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-[#212121] overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        Focus Timer
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">
                                        Time to lock in
                                    </p>
                                </div>
                                <div className="flex justify-center sm:justify-end">
                                    <FocusStats stats={todayStats} />
                                </div>
                            </div>

                            <Tabs defaultValue="timer" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="timer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                        <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Timer</span>
                                        <span className="sm:hidden">⏱</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="leaderboard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Leaderboard</span>
                                        <span className="sm:hidden">🏆</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">History</span>
                                        <span className="sm:hidden">📊</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="timer" className="mt-4 sm:mt-6">
                                    <div className="space-y-6 sm:space-y-8">
                                        {/* Tag Selection - Always visible */}
                                        <div className="max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tag (Optional)
                                            </label>
                                            <SearchableSelect
                                                options={[
                                                    { value: 'none', label: 'No tag' },
                                                    ...availableTags.map(tag => ({ value: tag.id.toString(), label: tag.name }))
                                                ]}
                                                value={selectedTagId}
                                                onValueChange={setSelectedTagId}
                                                onCreateNew={handleCreateTag}
                                                placeholder="Select or create a tag..."
                                                emptyText="No tags found."
                                                createText="Create tag"
                                            />
                                        </div>

                                        {/* Timer Display */}
                                        <div className="p-4 sm:p-6 lg:p-8">
                                                <div className="text-center">
                                                    {activeSession ? (
                                                        <div className="space-y-4 sm:space-y-6">
                                                            <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto">
                                                                {/* Gradient Background */}
                                                                <div 
                                                                    className="absolute inset-0 rounded-full blur-lg"
                                                                    style={{
                                                                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.03) 50%, transparent 100%)'
                                                                    }}
                                                                ></div>
                                                                <div 
                                                                    className="absolute inset-4 rounded-full blur-md"
                                                                    style={{
                                                                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, rgba(168, 85, 247, 0.02) 50%, transparent 100%)'
                                                                    }}
                                                                ></div>
                                                                <svg className="relative z-10 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                                    <defs>
                                                                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                            <stop offset="0%" stopColor="#8B5CF6" />
                                                                            <stop offset="50%" stopColor="#A855F7" />
                                                                            <stop offset="100%" stopColor="#C084FC" />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <circle
                                                                        cx="50"
                                                                        cy="50"
                                                                        r="45"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        fill="none"
                                                                        className="text-gray-200 dark:text-gray-600"
                                                                    />
                                                                    <circle
                                                                        cx="50"
                                                                        cy="50"
                                                                        r="45"
                                                                        stroke="url(#purpleGradient)"
                                                                        strokeWidth="6"
                                                                        fill="none"
                                                                        strokeDasharray={`${2 * Math.PI * 45}`}
                                                                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                                                                        className="transition-all duration-1000 ease-linear drop-shadow-lg"
                                                                        strokeLinecap="round"
                                                                        style={{
                                                                            filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))'
                                                                        }}
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                                                    <div className="text-center">
                                                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                                                                            {formatTime(timeRemaining, secondsRemaining)}
                                                                        </div>
                                                                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 mt-1 sm:mt-2 px-2">
                                                                            {activeSession.tag?.name || 'No tag'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4">
                                                                {activeSession.status === 'active' ? (
                                                                    <Button
                                                                        onClick={handlePause}
                                                                        disabled={isLoading}
                                                                        size="sm"
                                                                        className="sm:size-default lg:size-lg w-full sm:w-auto"
                                                                        variant="outline"
                                                                    >
                                                                        <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                                                        <span className="text-sm sm:text-base">Pause</span>
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        onClick={handleResume}
                                                                        disabled={isLoading}
                                                                        size="sm"
                                                                        className="sm:size-default lg:size-lg w-full sm:w-auto"
                                                                    >
                                                                        <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                                                        <span className="text-sm sm:text-base">Resume</span>
                                                                    </Button>
                                                                )}
                                                                
                                                                <Button
                                                                    onClick={handleComplete}
                                                                    disabled={isLoading}
                                                                    size="sm"
                                                                    className="sm:size-default lg:size-lg w-full sm:w-auto"
                                                                    variant="default"
                                                                >
                                                                    <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                                                    <span className="text-sm sm:text-base">Complete</span>
                                                                </Button>
                                                                
                                                                <Button
                                                                    onClick={handleCancel}
                                                                    disabled={isLoading}
                                                                    size="sm"
                                                                    className="sm:size-default lg:size-lg w-full sm:w-auto"
                                                                    variant="destructive"
                                                                >
                                                                    <Square className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                                                    <span className="text-sm sm:text-base">Cancel</span>
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-4 px-4 sm:px-0">
                                                                <Textarea
                                                                    placeholder="Add notes about this focus session..."
                                                                    value={sessionNotes}
                                                                    onChange={(e) => setSessionNotes(e.target.value)}
                                                                    className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4 sm:space-y-6">
                                                            <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto flex items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-full">
                                                                <div className="text-center">
                                                                    <Clock className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                                                    <p className="text-gray-500 dark:text-gray-300 text-sm sm:text-base px-4">
                                                                        Ready to focus?
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                        </div>

                                        {/* Duration Selection and Start Button - Only when no active session */}
                                        {!activeSession && (
                                            <div className="max-w-sm sm:max-w-md mx-auto space-y-4 px-4 sm:px-0">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Duration
                                                    </label>
                                                    <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
                                                        <SelectTrigger className="text-sm sm:text-base">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TIMER_DURATIONS.map((duration) => (
                                                                <SelectItem key={duration.value} value={duration.value.toString()} className="text-sm sm:text-base">
                                                                    {duration.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button
                                                    onClick={handleStart}
                                                    disabled={isLoading}
                                                    size="sm"
                                                    className="sm:size-default lg:size-lg w-full text-sm sm:text-base"
                                                >
                                                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                                    Start Focus Session
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="leaderboard" className="mt-4 sm:mt-6">
                                    <div className="px-2 sm:px-0">
                                        <FocusLeaderboard />
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="mt-4 sm:mt-6">
                                    <div className="px-2 sm:px-0">
                                        <FocusHistory />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}