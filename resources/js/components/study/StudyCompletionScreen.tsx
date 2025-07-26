import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCw, PlusCircle, Lightbulb } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FlashcardSet } from '@/types';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface FlashcardProgress {
    id: string;
    interval: number;
    repetition: number;
    efactor: number;
    nextReview: Date;
}

interface StudyCompletionScreenProps {
    flashcardSet: FlashcardSet;
    onRestart: () => void;
}

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    size: number;
    shape: 'square' | 'circle' | 'triangle';
    gravity: number;
    friction: number;
}

export const StudyCompletionScreen = ({ flashcardSet, onRestart }: StudyCompletionScreenProps) => {
    const { t } = useTranslation();
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const animationRef = useRef<number>();
    const containerRef = useRef<HTMLDivElement>(null);

    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const createConfettiPiece = (index: number): ConfettiPiece => {
        const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
        
        return {
            id: index,
            x: Math.random() * containerWidth,
            y: -20,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            size: Math.random() * 8 + 4,
            shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
            gravity: 0.3 + Math.random() * 0.2,
            friction: 0.99
        };
    };

    const updateConfetti = () => {
        setConfetti(prevConfetti => {
            const containerHeight = containerRef.current?.offsetHeight || window.innerHeight;
            const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
            
            return prevConfetti
                .map(piece => ({
                    ...piece,
                    x: piece.x + piece.vx,
                    y: piece.y + piece.vy,
                    vx: piece.vx * piece.friction,
                    vy: piece.vy + piece.gravity,
                    rotation: piece.rotation + piece.rotationSpeed
                }))
                .filter(piece => 
                    piece.y < containerHeight + 100 && 
                    piece.x > -50 && 
                    piece.x < containerWidth + 50
                );
        });
    };

    useEffect(() => {
        // Create initial confetti burst
        const pieces: ConfettiPiece[] = [];
        for (let i = 0; i < 80; i++) {
            pieces.push(createConfettiPiece(i));
        }
        setConfetti(pieces);

        // Start animation loop
        const animate = () => {
            updateConfetti();
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);

        // Add more confetti periodically
        const interval = setInterval(() => {
            setConfetti(prev => {
                if (prev.length < 20) {
                    const newPieces = [];
                    for (let i = 0; i < 10; i++) {
                        newPieces.push(createConfettiPiece(Date.now() + i));
                    }
                    return [...prev, ...newPieces];
                }
                return prev;
            });
        }, 300);

        // Stop confetti after 5 seconds
        const stopTimeout = setTimeout(() => {
            clearInterval(interval);
            // Let existing confetti fall naturally, but don't add new ones
            setTimeout(() => {
                setConfetti([]);
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            }, 3000); // Give existing confetti 3 more seconds to fall
        }, 5000);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            clearInterval(interval);
            clearTimeout(stopTimeout);
        };
    }, []);

    const getShapeStyle = (piece: ConfettiPiece) => {
        const baseStyle = {
            position: 'absolute' as const,
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            pointerEvents: 'none' as const,
        };

        switch (piece.shape) {
            case 'circle':
                return { ...baseStyle, borderRadius: '50%' };
            case 'triangle':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    width: 0,
                    height: 0,
                    borderLeft: `${piece.size / 2}px solid transparent`,
                    borderRight: `${piece.size / 2}px solid transparent`,
                    borderBottom: `${piece.size}px solid ${piece.color}`,
                };
            default:
                return baseStyle;
        }
    };

    return (
        <div 
            ref={containerRef}
            className="relative flex flex-col items-center justify-center min-h-[60vh] px-4 overflow-hidden"
        >
            {/* Confetti */}
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    style={getShapeStyle(piece)}
                />
            ))}

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="z-10"
            >
                <motion.div 
                    className="text-xl sm:text-2xl font-semibold mb-2 text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {t('study_well_done')} <span role="img" aria-label="bee">🐝</span>
                </motion.div>
                <motion.div 
                    className="mb-6 text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    {t('study_learning_continues')} <span role="img" aria-label="point">👈</span>
                </motion.div>
                
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-300">
                            <strong>{t('did_you_know')}</strong> {t('flashcard_tip_add_import')}
                        </AlertDescription>
                    </Alert>
                </motion.div>
                
                <motion.div 
                    className="flex flex-col sm:flex-row gap-2 w-full mb-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onRestart}
                    >
                        <RotateCw className="h-4 w-4 mr-2" />
                        {t('study_review_all')}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        asChild
                    >
                        <Link href={`/flashcard-sets/${flashcardSet.id}/edit`} className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {t('add_some_cards')}
                        </Link>
                    </Button>
                    
                </motion.div>
            </motion.div>
        </div>
    );
};