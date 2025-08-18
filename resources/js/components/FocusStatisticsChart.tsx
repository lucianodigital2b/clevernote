import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface TagData {
    name: string;
    color: string;
    minutes: number;
}

interface DayData {
    date: string;
    day: string;
    tags: TagData[];
    total_minutes: number;
}

interface StatisticsData {
    data: DayData[];
    all_tags: string[];
}

interface FocusStatisticsChartProps {
    days?: number;
}

const FocusStatisticsChart: React.FC<FocusStatisticsChartProps> = ({ days = 7 }) => {
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const ENABLE_DUMMY_DATA = false;

    useEffect(() => {
        if (ENABLE_DUMMY_DATA) {
            generateDummyData();
        } else {
            fetchStatistics();
        }
    }, [days, ENABLE_DUMMY_DATA]);

    const generateDummyData = () => {
        setLoading(true);
        
        // Generate dummy tags with pastel colors
        const dummyTags = [
            { name: 'Study', color: '#FFB3BA' },
            { name: 'Work', color: '#BAFFC9' },
            { name: 'Reading', color: '#FFFFBA' },
            { name: 'Research', color: '#D4BAFF' },
            { name: 'Writing', color: '#FFDFBA' },
            { name: 'Planning', color: '#BAE1FF' }
        ];
        
        const dummyData: DayData[] = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Generate random number of tags for this day (0-4)
            const numTags = Math.floor(Math.random() * 5);
            const dayTags: TagData[] = [];
            let totalMinutes = 0;
            
            if (numTags > 0) {
                // Randomly select tags for this day
                const selectedTags = dummyTags
                    .sort(() => 0.5 - Math.random())
                    .slice(0, numTags);
                
                selectedTags.forEach(tag => {
                    const minutes = Math.floor(Math.random() * 120) + 15; // 15-135 minutes
                    dayTags.push({
                        name: tag.name,
                        color: tag.color,
                        minutes: minutes
                    });
                    totalMinutes += minutes;
                });
            }
            
            dummyData.push({
                date: dateStr,
                day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                tags: dayTags,
                total_minutes: totalMinutes
            });
        }
        
        const result: StatisticsData = {
            data: dummyData,
            all_tags: dummyTags.map(tag => tag.name)
        };
        
        setData(result);
        setLoading(false);
    };

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/focus/statistics?days=${days}`);
            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getMaxHours = () => {
        if (!data) return 0;
        return Math.max(...data.data.map(day => Math.ceil(day.total_minutes / 60)), 1);
    };

    const formatMinutesToHours = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Focus Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Focus Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-500 py-8">
                        Error: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Focus Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500 py-8">
                        No focus session data available for the selected period.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxHours = getMaxHours();
    const barHeight = 40;
    const chartHeight = data.data.length * (barHeight + 10) + 40;
    const leftMargin = 150;
    const rightMargin = 100;

    return (
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-200 to-purple-200 border-b-4 border-black">
                <CardTitle className="text-2xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Focus Statistics - Last {days} Days</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="w-full overflow-x-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-50">
                    <svg width="100%" height={chartHeight} className="" viewBox={`0 0 800 ${chartHeight}`} preserveAspectRatio="none">
                        {/* Hour markers */}
                        {Array.from({ length: maxHours + 1 }, (_, i) => {
                            const chartWidth = 800 - leftMargin - rightMargin;
                            return (
                                <g key={i}>
                                    <line
                                        x1={leftMargin + (i * chartWidth) / maxHours}
                                        y1={20}
                                        x2={leftMargin + (i * chartWidth) / maxHours}
                                        y2={chartHeight - 20}
                                        stroke="#e5e7eb"
                                        strokeWidth={1}
                                    />
                                    <text
                                        x={leftMargin + (i * chartWidth) / maxHours}
                                        y={15}
                                        textAnchor="middle"
                                        fontSize={14}
                                        fill="#000000"
                                        fontFamily="Comic Sans MS, cursive"
                                        fontWeight="bold"
                                    >
                                        {i}h
                                    </text>
                                </g>
                            );
                        })}

                        {/* Data bars */}
                        {data.data.map((day, dayIndex) => {
                            const y = 30 + dayIndex * (barHeight + 10);
                            let currentX = leftMargin;
                            const chartWidth = 800 - leftMargin - rightMargin;

                            return (
                                <g key={day.date}>
                                    {/* Day label */}
                                    <text
                                        x={leftMargin - 10}
                                        y={y + barHeight / 2 + 4}
                                        textAnchor="end"
                                        fontSize={14}
                                        fill="#000000"
                                        fontFamily="Comic Sans MS, cursive"
                                        fontWeight="bold"
                                    >
                                        {day.day}
                                    </text>

                                    {/* Tag segments */}
                                    {day.tags.map((tag, tagIndex) => {
                                        const segmentWidth = (tag.minutes / 60) * (chartWidth / maxHours);
                                        const segment = (
                                            <g key={`${day.date}-${tag.name}`}>
                                                <rect
                                                    x={currentX}
                                                    y={y}
                                                    width={segmentWidth}
                                                    height={barHeight}
                                                    fill={tag.color}
                                                    stroke="#000000"
                                                    strokeWidth={3}
                                                />
                                                {segmentWidth > 30 && (
                                                    <text
                                                        x={currentX + segmentWidth / 2}
                                                        y={y + barHeight / 2 + 4}
                                                        textAnchor="middle"
                                                        fontSize={12}
                                                        fill="#000000"
                                                        fontFamily="Comic Sans MS, cursive"
                                                        fontWeight="bold"
                                                    >
                                                        {formatMinutesToHours(tag.minutes)}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                        currentX += segmentWidth;
                                        return segment;
                                    })}

                                    {/* Total time label */}
                                    {day.total_minutes > 0 && (
                                        <text
                                            x={currentX + 10}
                                            y={y + barHeight / 2 + 4}
                                            fontSize={13}
                                            fill="#000000"
                                            fontFamily="Comic Sans MS, cursive"
                                            fontWeight="bold"
                                        >
                                            {formatMinutesToHours(day.total_minutes)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                {data.all_tags.length > 0 && (
                    <div className="mt-6 p-4 border-4 border-black bg-gradient-to-r from-blue-100 to-green-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-lg font-bold mb-3" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Tags:</h4>
                        <div className="flex flex-wrap gap-3">
                            {data.data
                                .flatMap(day => day.tags)
                                .reduce((unique: TagData[], tag) => {
                                    if (!unique.find(t => t.name === tag.name)) {
                                        unique.push(tag);
                                    }
                                    return unique;
                                }, [])
                                .map(tag => (
                                    <div key={tag.name} className="flex items-center gap-2 bg-white border-3 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div
                                            className="w-4 h-4 border-2 border-black"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="text-sm font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>{tag.name}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FocusStatisticsChart;