import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Calendar, BookOpen, Target, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudyPlanEvent {
    id?: string;
    title: string;
    start?: string;
    end?: string;
    description?: string;
    category: 'study' | 'review' | 'practice' | 'break' | 'assessment';
    week?: number;
    backgroundColor?: string;
    borderColor?: string;
    daysOfWeek?: number[];
    startRecur?: string;
    endRecur?: string;
    className?: string;
}

interface StudyPlan {
    plan_title: string;
    plan_description: string;
    weekly_goals: Array<{
        week: number;
        title: string;
        description: string;
        focus_areas: string[];
    }>;
    calendar_events: StudyPlanEvent[];
    study_tips: string[];
    success_metrics: string[];
}

interface UserStatistic {
    date: string;
    quiz_attempts: number;
    quiz_correct_answers: number;
    quiz_total_questions: number;
    flashcard_reviews: number;
    flashcard_correct: number;
    study_time_minutes: number;
    current_streak: number;
    max_streak: number;
}

interface StudyPlanCalendarProps {
    studyPlan: StudyPlan | null;
    userStatistics?: UserStatistic[];
    onClose?: () => void;
}

export default function StudyPlanCalendar({ studyPlan, userStatistics = [], onClose }: StudyPlanCalendarProps) {
    const { t } = useTranslation();
    const [selectedDay, setSelectedDay] = useState<any>(null);

    if (!studyPlan) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {t('study_plan_not_available')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {t('study_plan_generate_first')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Generate calendar days for the current month
    const generateCalendarDays = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get first day of month and calculate starting position
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        
        // Adjust to start from Monday (1) instead of Sunday (0)
        const dayOfWeek = (firstDay.getDay() + 6) % 7;
        startDate.setDate(startDate.getDate() - dayOfWeek);
        
        const days = [];
        const plannedStudyDays = getStudyDaysFromEvents();
        
        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayNumber = date.getDate();
            const isCurrentMonth = date.getMonth() === currentMonth;
            const dateString = date.toISOString().split('T')[0];
            const isPlannedStudyDay = plannedStudyDays.includes(dateString);
            
            days.push({
                date: isCurrentMonth ? dayNumber : null,
                fullDate: date,
                isPlannedStudyDay: isCurrentMonth && isPlannedStudyDay,
                isEmpty: !isCurrentMonth,
                dateString
            });
        }
        
        return days;
    };
    
    // Extract planned study days from calendar events
    const getStudyDaysFromEvents = () => {
        if (!studyPlan?.calendar_events || studyPlan.calendar_events.length === 0) {
            return [];
        }
        
        const studyDates: string[] = [];
        
        studyPlan.calendar_events.forEach((event: any) => {
            const isStudyEvent = event.category === 'study' || 
                               event.category === 'review' || 
                               event.category === 'practice' ||
                               event.category === 'assessment';
            
            if (!isStudyEvent) return;
            
            // Handle single date events
            if (event.start) {
                const dateStr = event.start.includes('T') ? event.start.split('T')[0] : event.start;
                studyDates.push(dateStr);
            }
            
            // Handle recurring events with daysOfWeek
            if (event.daysOfWeek && event.startRecur && event.endRecur) {
                const startDate = new Date(event.startRecur);
                const endDate = new Date(event.endRecur);
                const currentDate = new Date(startDate);
                
                while (currentDate <= endDate) {
                    const dayOfWeek = currentDate.getDay();
                    if (event.daysOfWeek.includes(dayOfWeek)) {
                        studyDates.push(currentDate.toISOString().split('T')[0]);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        });
        
        // Remove duplicates
        return [...new Set(studyDates)];
    };
    

    
    const handleDayClick = (day: any) => {
        if (day.isPlannedStudyDay) {
            const dayEvents = studyPlan?.calendar_events?.filter((event: any) => {
                // Check single date events
                if (event.start) {
                    const eventDate = event.start.includes('T') ? event.start.split('T')[0] : event.start;
                    return eventDate === day.dateString;
                }
                
                // Check recurring events
                if (event.daysOfWeek && event.startRecur && event.endRecur) {
                    const clickedDate = new Date(day.dateString);
                    const startDate = new Date(event.startRecur);
                    const endDate = new Date(event.endRecur);
                    const dayOfWeek = clickedDate.getDay();
                    
                    return clickedDate >= startDate && 
                           clickedDate <= endDate && 
                           event.daysOfWeek.includes(dayOfWeek);
                }
                
                return false;
            }) || [];
            
            const dayStats = userStatistics?.find(
                stat => stat.date === day.dateString
            );
            
            setSelectedDay({ ...day, events: dayEvents, userStatistic: dayStats });
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'study':
                return <BookOpen className="h-4 w-4" />;
            case 'review':
                return <Target className="h-4 w-4" />;
            case 'practice':
                return <Target className="h-4 w-4" />;
            case 'assessment':
                return <Target className="h-4 w-4" />;
            default:
                return <Calendar className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'study':
                return 'bg-blue-100 text-blue-800';
            case 'review':
                return 'bg-green-100 text-green-800';
            case 'practice':
                return 'bg-purple-100 text-purple-800';
            case 'break':
                return 'bg-orange-100 text-orange-800';
            case 'assessment':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Calendar className="h-8 w-8 text-primary" />
                    {studyPlan.plan_title}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {studyPlan.plan_description}
                </p>
                {onClose && (
                    <Button variant="outline" onClick={onClose}>
                        {t('close')}
                    </Button>
                )}
            </motion.div>

            {/* Custom Calendar Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                    {t('suggested_study_routine') || 'Rotina de estudo sugerida'}
                </h2>
                
                {/* Calendar Grid */}
                <div className="space-y-4">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                            <div key={day} className="text-center text-gray-500 font-medium text-sm py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-2">
                        {generateCalendarDays().map((day, index) => {
                            const getDayStyle = () => {
                                if (day.isEmpty) return 'opacity-0 pointer-events-none';
                                
                                if (day.isPlannedStudyDay) {
                                    // Planned study day
                                    return 'bg-yellow-200 text-gray-900 border-2 border-yellow-400';
                                } else {
                                    // Regular day
                                    return 'bg-gray-200 text-gray-600';
                                }
                            };
                            
                            return (
                                <div
                                    key={index}
                                    className={`
                                        relative h-16 rounded-xl flex items-center justify-center text-lg font-medium
                                        transition-all duration-200 hover:scale-105 cursor-pointer
                                        ${getDayStyle()}
                                    `}
                                    onClick={() => day.date && handleDayClick(day)}
                                >
                                    <span className="relative z-10">{day.date}</span>
                                    {day.isPlannedStudyDay && (
                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-400 rounded"></div>
                        <span className="text-sm text-gray-600">{t('planned_study_day')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <span className="text-sm text-gray-600">{t('rest')}</span>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Goals */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {studyPlan.weekly_goals.map((goal, index) => (
                    <Card key={goal.week}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">
                                {t('week')} {goal.week}
                            </CardTitle>
                            <p className="text-sm font-medium">{goal.title}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {goal.description}
                            </p>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {t('focus_areas')}:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {goal.focus_areas.map((area, areaIndex) => (
                                        <Badge key={areaIndex} variant="secondary" className="text-xs">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Study Tips and Success Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Tips */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                {t('study_tips')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {studyPlan.study_tips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary font-medium">•</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Success Metrics */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-green-500" />
                                {t('success_metrics')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {studyPlan.success_metrics.map((metric, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary font-medium">•</span>
                                        <span>{metric}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Day Details Modal */}
            {selectedDay && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
                    onClick={() => setSelectedDay(null)}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white rounded-t-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
                            <div className="flex items-center justify-center mb-2">
                                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {selectedDay.fullDate.toLocaleDateString('pt-BR', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </h3>
                                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {t('planned_study_day')}
                                    </span>
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="px-6 py-6">
                            <div className="space-y-6">
                                {/* Planned Study Events */}
                                {selectedDay.isPlannedStudyDay && selectedDay.events && selectedDay.events.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-yellow-400 rounded-full"></div>
                                            <h4 className="font-semibold text-lg text-gray-900">{t('planned_activities')}</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedDay.events.map((event: any, index: number) => (
                                                <div key={index} className="border border-yellow-200 rounded-xl p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h5 className="font-semibold text-gray-900">{event.title}</h5>
                                                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                            {event.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            {new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                                                            {new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                

                                
                                {/* Default message for rest days */}
                                {!selectedDay.isPlannedStudyDay && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2">{t('rest')}</h4>
                                        <p className="text-gray-600 max-w-sm mx-auto">{t('rest_day_description')}</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Bottom Action */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 mt-6">
                                <Button 
                                    onClick={() => setSelectedDay(null)} 
                                    className="w-full h-12 text-base font-medium"
                                    size="lg"
                                >
                                    {t('close')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}