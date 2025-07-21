import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, FileText, Grid3X3, Loader2, AlertCircle, CheckCircle2, RotateCcw, Trophy, Timer, Lightbulb, Eye, EyeOff } from 'lucide-react';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toastConfig } from '@/lib/toast';
import axios from 'axios';
import Crossword from '@jaredreisinger/react-crossword';

dayjs.extend(relativeTime);

interface CrosswordData {
    id: number;
    uuid: string;
    title: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    failure_reason?: string;
    puzzle_data: {
        title: string;
        across: { [key: string]: { clue: string; answer: string; row: number; col: number } };
        down: { [key: string]: { clue: string; answer: string; row: number; col: number } };
    };
    created_at: string;
    updated_at: string;
    note: {
        id: number;
        title: string;
    };
}

interface CrosswordShowProps {
    crossword: CrosswordData;
}

export default function Show({ crossword }: CrosswordShowProps) {
    const [isRetrying, setIsRetrying] = useState(false);
    const [currentCrossword, setCurrentCrossword] = useState(crossword);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [hintsUsed, setHintsUsed] = useState({ letters: 0, words: 0 });
    const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
    const [currentFocus, setCurrentFocus] = useState<{ row: number; col: number; direction: 'across' | 'down' } | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [cellValidation, setCellValidation] = useState<{ [key: string]: 'correct' | 'incorrect' | 'empty' }>({});
    const crosswordRef = useRef<any>(null);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (startTime && !isCompleted) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [startTime, isCompleted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Helper function to get the correct answer for a specific cell
    const getCorrectAnswerForCell = (row: number, col: number) => {
        if (!currentCrossword.puzzle_data) return null;
        
        const { across, down } = currentCrossword.puzzle_data;
        console.log('Looking for answer at:', { row, col });
        console.log('Across clues:', across);
        console.log('Down clues:', down);
        
        // Check across clues
        for (const [number, clue] of Object.entries(across)) {
            console.log(`Checking across clue ${number}:`, clue);
            if (clue.row === row && col >= clue.col && col < clue.col + clue.answer.length) {
                const letterIndex = col - clue.col;
                const letter = clue.answer[letterIndex].toUpperCase();
                console.log(`Found across match! Letter: ${letter}`);
                return letter;
            }
        }
        
        // Check down clues
        for (const [number, clue] of Object.entries(down)) {
            console.log(`Checking down clue ${number}:`, clue);
            if (clue.col === col && row >= clue.row && row < clue.row + clue.answer.length) {
                const letterIndex = row - clue.row;
                const letter = clue.answer[letterIndex].toUpperCase();
                console.log(`Found down match! Letter: ${letter}`);
                return letter;
            }
        }
        
        console.log('No match found for', { row, col });
        return null;
    };

    // Helper function to validate a cell's answer
    const validateCell = (row: number, col: number, userInput: string) => {
        const correctAnswer = getCorrectAnswerForCell(row, col);
        if (!correctAnswer) return 'empty';
        
        if (!userInput || userInput.trim() === '') return 'empty';
        
        return userInput.toUpperCase() === correctAnswer ? 'correct' : 'incorrect';
    };

    // Helper function to validate all user answers
    const validateAllAnswers = () => {
        const newValidation: { [key: string]: 'correct' | 'incorrect' | 'empty' } = {};
        
        Object.entries(userAnswers).forEach(([cellKey, answer]) => {
            const [row, col] = cellKey.split('-').map(Number);
            newValidation[cellKey] = validateCell(row, col, answer);
        });
        
        setCellValidation(newValidation);
    };

    // Helper function to find the current clue based on focus
    const findCurrentClue = () => {
        if (!currentFocus || !currentCrossword.puzzle_data) return null;
        
        const { across, down } = currentCrossword.puzzle_data;
        const clues = currentFocus.direction === 'across' ? across : down;
        
        // Find the clue that contains the current focus position
        for (const [number, clue] of Object.entries(clues)) {
            if (currentFocus.direction === 'across') {
                if (clue.row === currentFocus.row && 
                    currentFocus.col >= clue.col && 
                    currentFocus.col < clue.col + clue.answer.length) {
                    return { number, ...clue };
                }
            } else {
                if (clue.col === currentFocus.col && 
                    currentFocus.row >= clue.row && 
                    currentFocus.row < clue.row + clue.answer.length) {
                    return { number, ...clue };
                }
            }
        }
        return null;
    };

    // Helper function to get all cell coordinates for a word
    const getWordCells = (clue: any, direction: 'across' | 'down') => {
        const cells = [];
        for (let i = 0; i < clue.answer.length; i++) {
            if (direction === 'across') {
                cells.push({ row: clue.row, col: clue.col + i, letter: clue.answer[i] });
            } else {
                cells.push({ row: clue.row + i, col: clue.col, letter: clue.answer[i] });
            }
        }
        return cells;
    };

    const handleRetry = async () => {
        setIsRetrying(true);
        
        try {
            await axios.post(`/crosswords/${crossword.id}/retry`);
            toastConfig.success('Crossword regeneration started');
            
            // Start polling for status
            const intervalId = setInterval(async () => {
                try {
                    const response = await axios.get(`/crosswords/${crossword.id}/status`);
                    const data = response.data;
                    
                    setCurrentCrossword(prev => ({ ...prev, ...data }));
                    
                    if (data.status === 'completed' || data.status === 'failed') {
                        clearInterval(intervalId);
                        setIsRetrying(false);
                        
                        if (data.status === 'completed') {
                            toastConfig.success('Crossword regenerated successfully');
                        } else {
                            toastConfig.error('Crossword regeneration failed');
                        }
                    }
                } catch (error) {
                    clearInterval(intervalId);
                    setIsRetrying(false);
                    toastConfig.error('Failed to check crossword status');
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error retrying crossword:', error);
            toastConfig.error('Failed to retry crossword generation');
            setIsRetrying(false);
        }
    };

    const handleCrosswordStart = () => {
        if (!startTime) {
            setStartTime(new Date());
        }
    };

    // Handle cell changes and validate answers
    const handleCellChange = (row: number, col: number, char: string) => {
        handleCrosswordStart();
        
        console.log('Cell change:', { row, col, char });
        console.log('Puzzle data:', currentCrossword.puzzle_data);
        
        const cellKey = `${row}-${col}`;
        const newUserAnswers = { ...userAnswers };
        
        if (char && char.trim() !== '') {
            newUserAnswers[cellKey] = char.toUpperCase();
        } else {
            delete newUserAnswers[cellKey];
        }
        
        setUserAnswers(newUserAnswers);
        
        // Validate this specific cell
        const correctAnswer = getCorrectAnswerForCell(row, col);
        console.log('Expected answer for', row, col, ':', correctAnswer);
        
        const validation = validateCell(row, col, char);
        console.log('Validation result:', validation);
        
        setCellValidation(prev => ({
            ...prev,
            [cellKey]: validation
        }));
    };

    // Track focus changes in the crossword
    const handleCellFocus = (event: any) => {
        // Use a more robust approach to track focus
        setTimeout(() => {
            const focusedInput = document.querySelector('input:focus') as HTMLInputElement;
            if (focusedInput && currentCrossword.puzzle_data) {
                // Get the cell position from the DOM
                const cellElement = focusedInput.closest('g[data-row][data-col]') || 
                                  focusedInput.closest('[data-row][data-col]');
                
                if (cellElement) {
                    const row = parseInt(cellElement.getAttribute('data-row') || '0');
                    const col = parseInt(cellElement.getAttribute('data-col') || '0');
                    
                    // Find which clue this cell belongs to
                    let direction = 'across';
                    let foundClue = null;
                    
                    // Check across clues first
                    for (const [clueNumber, clue] of Object.entries(currentCrossword.puzzle_data.across || {})) {
                        if (row === clue.row && col >= clue.col && col < clue.col + clue.answer.length) {
                            direction = 'across';
                            foundClue = clue;
                            break;
                        }
                    }
                    
                    // If not found in across, check down clues
                    if (!foundClue) {
                        for (const [clueNumber, clue] of Object.entries(currentCrossword.puzzle_data.down || {})) {
                            if (col === clue.col && row >= clue.row && row < clue.row + clue.answer.length) {
                                direction = 'down';
                                foundClue = clue;
                                break;
                            }
                        }
                    }
                    console.log('chego');
                    
                    setCurrentFocus({ row, col, direction });
                }
            }
        }, 50);
    };

    // Add global click listener to track focus
    React.useEffect(() => {
        const handleGlobalClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' && target.closest('.crossword')) {
                handleCellFocus(event);
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [currentCrossword.puzzle_data]);

    // Apply validation classes to crossword cells
    React.useEffect(() => {
        const applyCellValidation = () => {
            const crosswordElement = document.querySelector('.crossword');
            if (!crosswordElement) return;

            // Remove all existing validation classes
            const allRects = crosswordElement.querySelectorAll('svg rect');
            allRects.forEach(rect => {
                rect.classList.remove('cell-correct', 'cell-incorrect');
            });

            // Apply validation classes based on current state
            Object.entries(cellValidation).forEach(([cellKey, validation]) => {
                const [row, col] = cellKey.split('-').map(Number);
                
                // Find the rect element for this cell
                const rectElements = crosswordElement.querySelectorAll('svg rect');
                rectElements.forEach(rect => {
                    const parentG = rect.closest('g[data-row][data-col]');
                    if (parentG) {
                        const rectRow = parseInt(parentG.getAttribute('data-row') || '0');
                        const rectCol = parseInt(parentG.getAttribute('data-col') || '0');
                        
                        if (rectRow === row && rectCol === col) {
                            if (validation === 'correct') {
                                rect.classList.add('cell-correct');
                            } else if (validation === 'incorrect') {
                                rect.classList.add('cell-incorrect');
                            }
                        }
                    }
                });
            });
        };

        // Apply validation with a small delay to ensure DOM is ready
        const timeoutId = setTimeout(applyCellValidation, 100);
        return () => clearTimeout(timeoutId);
    }, [cellValidation]);

    const handleCrosswordComplete = () => {
        setIsCompleted(true);
        const hintPenalty = (hintsUsed.letters * 5) + (hintsUsed.words * 15);
        const finalTime = elapsedTime + hintPenalty;
        toastConfig.success(`Congratulations! You completed the crossword in ${formatTime(finalTime)}! ${hintsUsed.letters + hintsUsed.words > 0 ? `(${hintPenalty}s penalty for hints)` : ''}`);
    };

    const handleRevealLetter = () => {
        console.log(currentFocus);
        
        if (!currentFocus) {
            toastConfig.error('Please click on a cell first to reveal a letter');
            return;
        }

        const currentClue = findCurrentClue();
        if (!currentClue) {
            toastConfig.error('Unable to find the current word');
            return;
        }

        const cellKey = `${currentFocus.row}-${currentFocus.col}`;
        if (revealedCells.has(cellKey)) {
            toastConfig.info('This letter is already revealed');
            return;
        }

        // Get the letter for the current position
        const letterIndex = currentFocus.direction === 'across' 
            ? currentFocus.col - currentClue.col 
            : currentFocus.row - currentClue.row;
        
        const letter = currentClue.answer[letterIndex];
        
        // Add to revealed cells
        setRevealedCells(prev => new Set([...prev, cellKey]));
        setHintsUsed(prev => ({ ...prev, letters: prev.letters + 1 }));
        
        // Find and fill the current input
        setTimeout(() => {
            // Try multiple selectors to find the input
            let input = document.querySelector('input:focus') as HTMLInputElement;
            
            if (!input) {
                // Try to find input by position
                const inputs = document.querySelectorAll('.crossword input');
                for (const inp of inputs) {
                    const cell = inp.closest('[data-row][data-col]') || inp.closest('g[data-row][data-col]');
                    if (cell) {
                        const row = parseInt(cell.getAttribute('data-row') || '0');
                        const col = parseInt(cell.getAttribute('data-col') || '0');
                        if (row === currentFocus.row && col === currentFocus.col) {
                            input = inp as HTMLInputElement;
                            break;
                        }
                    }
                }
            }
            
            if (input) {
                input.value = letter.toUpperCase();
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, 100);
        
        toastConfig.success(`Letter "${letter.toUpperCase()}" revealed! (+5s penalty)`);
    };

    const handleRevealWord = () => {
        if (!currentFocus) {
            toastConfig.error('Please click on a cell first to reveal a word');
            return;
        }

        const currentClue = findCurrentClue();
        if (!currentClue) {
            toastConfig.error('Unable to find the current word');
            return;
        }

        const wordCells = getWordCells(currentClue, currentFocus.direction);
        const newRevealedCells = new Set(revealedCells);
        
        // Add all cells of the word to revealed cells
        wordCells.forEach(cell => {
            newRevealedCells.add(`${cell.row}-${cell.col}`);
        });
        
        setRevealedCells(newRevealedCells);
        setHintsUsed(prev => ({ ...prev, words: prev.words + 1 }));
        
        // Fill all cells of the word
        setTimeout(() => {
            const inputs = document.querySelectorAll('.crossword input');
            
            wordCells.forEach((cell, index) => {
                setTimeout(() => {
                    // Find the input for this specific cell
                    for (const inp of inputs) {
                        const cellElement = inp.closest('[data-row][data-col]') || inp.closest('g[data-row][data-col]');
                        if (cellElement) {
                            const row = parseInt(cellElement.getAttribute('data-row') || '0');
                            const col = parseInt(cellElement.getAttribute('data-col') || '0');
                            if (row === cell.row && col === cell.col) {
                                const input = inp as HTMLInputElement;
                                input.value = cell.letter.toUpperCase();
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                break;
                            }
                        }
                    }
                }, index * 100); // Stagger the reveals for visual effect
            });
        }, 100);
        
        toastConfig.success(`Word "${currentClue.answer.toUpperCase()}" revealed! (+15s penalty)`);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'generating':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'generating':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        }
    };

    return (
        <AppLayout>
            <Head title={currentCrossword.title} />
            
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className='w-full'>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/crosswords')}
                            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Crosswords
                        </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                        {currentCrossword.title}
                                    </h1>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        From note: {currentCrossword.note.title}
                                    </p>
                                </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {startTime && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <Timer className="h-4 w-4" />
                                    <span>{formatTime(elapsedTime)}</span>
                                    {isCompleted && <Trophy className="h-4 w-4 text-yellow-500" />}
                                </div>
                            )}
                            
                            {(hintsUsed.letters > 0 || hintsUsed.words > 0) && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <Lightbulb className="h-4 w-4" />
                                    <span>Hints: {hintsUsed.letters}L, {hintsUsed.words}W</span>
                                </div>
                            )}
                            
                            {/* {currentCrossword.status === 'completed' && !isCompleted && (
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRevealLetter}
                                        className="flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Reveal Letter
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRevealWord}
                                        className="flex items-center gap-2"
                                    >
                                        <EyeOff className="h-4 w-4" />
                                        Reveal Word
                                    </Button>
                                </div>
                            )} */}
                            
                            <Button 
                                variant="outline"
                                onClick={() => router.visit(`/notes/${currentCrossword.note.id}/edit`)}
                                className="flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                View Note
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {currentCrossword.status === 'completed' && currentCrossword.puzzle_data ? (
                        <div className="space-y-6">
                            {/* Crossword Instructions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Grid3X3 className="h-5 w-5" />
                                        How to Play
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                        <li>• Click on a numbered square to start entering your answer</li>
                                        <li>• Use the Tab key or click to switch between Across and Down clues</li>
                                        <li>• Press Backspace to delete letters</li>
                                        <li>• Correct letters will be highlighted in <span className="text-green-600 font-medium">green</span>, incorrect ones in <span className="text-red-600 font-medium">red</span></li>
                                        <li>• The puzzle is completed when all squares are filled correctly</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Crossword Puzzle */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="crossword-container">
                                        <Crossword
                                            ref={crosswordRef}
                                            data={currentCrossword.puzzle_data}
                                            onCrosswordComplete={handleCrosswordComplete}
                                            onCellChange={handleCellChange}
                                            onClick={handleCellFocus}
                                            theme={{
                                                gridBackground: 'transparent',
                                                cellBackground: 'transparent',
                                                cellBorder: '#e5e7eb',
                                                textColor: '#1f2937',
                                                numberColor: '#6b7280',
                                                focusBackground: '#dbeafe',
                                                highlightBackground: '#f3f4f6',
                                            }}
                                            style={{
                                                '--cell-border-radius': '4px',
                                                '--cell-fill-transparent': 'transparent',
                                                '--cell-fill-light-blue': '#dbeafe',
                                                '--cell-fill-light-white': '#f9fafb',
                                                '--text-color': '#1f2937',
                                                '--stroke-color': '#e5e7eb',
                                                '--stroke-width': '2',
                                                backdropFilter: 'blur(8px)',
                                            } as React.CSSProperties}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : currentCrossword.status === 'failed' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    Generation Failed
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentCrossword.failure_reason && (
                                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                        {currentCrossword.failure_reason}
                                    </div>
                                )}
                                <Button 
                                    onClick={handleRetry}
                                    disabled={isRetrying}
                                    className="flex items-center gap-2"
                                >
                                    {isRetrying ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="h-4 w-4" />
                                    )}
                                    Retry Generation
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generating Crossword...
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Please wait while we generate your crossword puzzle from the note content. 
                                    This may take a few moments.
                                </p>
                                <div className="mt-4 text-sm text-neutral-500">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Started {dayjs(currentCrossword.created_at).fromNow()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .crossword-container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                
                .crossword {
                    font-family: inherit;
                }
                
                /* Custom styles for crossword cells with rounded borders */
                .crossword svg rect {
                    rx: 4px;
                    ry: 4px;
                    stroke-width: 1.5px;
                }
                
                .crossword svg rect[fill="transparent"] {
                    fill: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                }
                
                .crossword svg rect[fill="#dbeafe"] {
                    fill: #dbeafe;
                    rx: 4px;
                    ry: 4px;
                }
                
                .crossword svg rect[fill="#f0f9ff"] {
                    fill: #f0f9ff;
                    rx: 4px;
                    ry: 4px;
                }

                /* Validation styles for correct and incorrect answers */
                .crossword svg rect.cell-correct {
                    fill: #dcfce7 !important;
                    stroke: #16a34a !important;
                    stroke-width: 2px !important;
                }
                
                .crossword svg rect.cell-incorrect {
                    fill: #fecaca !important;
                    stroke: #dc2626 !important;
                    stroke-width: 2px !important;
                }
                
                /* Dark mode adjustments */
                .dark .crossword svg rect[fill="transparent"] {
                    fill: rgba(31, 41, 55, 0.8);
                    stroke: #6b7280;
                }
                
                .dark .crossword svg text {
                    fill: #f9fafb;
                }
                
                .dark .crossword svg rect[fill="#dbeafe"] {
                    fill: #1e40af;
                }
                
                .dark .crossword svg rect[fill="#f0f9ff"] {
                    fill: #1e3a8a;
                }

                /* Dark mode validation styles */
                .dark .crossword svg rect.cell-correct {
                    fill: #14532d !important;
                    stroke: #22c55e !important;
                }
                
                .dark .crossword svg rect.cell-incorrect {
                    fill: #7f1d1d !important;
                    stroke: #ef4444 !important;
                }
                
                .crossword .clue {
                    font-size: 14px;
                    line-height: 1.4;
                    margin-bottom: 8px;
                }
                
                .crossword .grid {
                    margin-bottom: 2rem;
                }
                
                .crossword .clues {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }
                
                @media (max-width: 768px) {
                    .crossword .clues {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                }
                
                .crossword .clues h3 {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    color: inherit;
                }
                
                .crossword .clue-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .crossword .clue-list li {
                    margin-bottom: 0.5rem;
                    padding: 0.5rem;
                    transition: background-color 0.2s;
                }
                
                .crossword .clue-list li:hover {
                    background-color: #f3f4f6;
                }
                
                .dark .crossword .clue-list li:hover {
                    background-color: #374151;
                }
            `}</style>
        </AppLayout>
    );
}