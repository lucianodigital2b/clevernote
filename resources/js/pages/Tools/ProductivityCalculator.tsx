import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Layout from '@/layouts/Layout';

interface ProductivityCalculatorProps {
    locale: string;
}

interface ProductivityMetrics {
    focusTime: number;
    breakTime: number;
    tasksCompleted: number;
    distractions: number;
    energyLevel: number;
    satisfactionLevel: number;
}

interface ProductivityResult {
    score: number;
    level: string;
    recommendations: string[];
    insights: string[];
}

const ProductivityCalculator: React.FC<ProductivityCalculatorProps> = ({ locale }) => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<ProductivityMetrics>({
        focusTime: 0,
        breakTime: 0,
        tasksCompleted: 0,
        distractions: 0,
        energyLevel: 5,
        satisfactionLevel: 5
    });
    const [result, setResult] = useState<ProductivityResult | null>(null);
    const [timeframe, setTimeframe] = useState<'day' | 'week'>('day');

    const getLocalizedText = (key: string) => {
        const texts: Record<string, Record<string, string>> = {
            en: {
                title: 'Productivity Calculator',
                description: 'Analyze your productivity patterns and get personalized recommendations for improvement',
                timeframe_label: 'Time Frame',
                daily: 'Daily',
                weekly: 'Weekly',
                focus_time_label: 'Focus Time (hours)',
                break_time_label: 'Break Time (hours)',
                tasks_completed_label: 'Tasks Completed',
                distractions_label: 'Number of Distractions',
                energy_level_label: 'Energy Level (1-10)',
                satisfaction_level_label: 'Satisfaction Level (1-10)',
                calculate_productivity: 'Calculate Productivity',
                your_productivity_score: 'Your Productivity Score',
                productivity_level: 'Productivity Level',
                recommendations: 'Recommendations',
                insights: 'Key Insights',
                recalculate: 'Recalculate',
                export_report: 'Export Report',
                report_exported: 'Productivity report exported successfully!',
                // Productivity levels
                excellent: 'Excellent',
                good: 'Good',
                average: 'Average',
                needs_improvement: 'Needs Improvement',
                poor: 'Poor',
                // Recommendations
                rec_pomodoro: 'Try the Pomodoro Technique (25min focus + 5min break)',
                rec_eliminate_distractions: 'Identify and eliminate your main sources of distraction',
                rec_energy_management: 'Schedule demanding tasks during your high-energy periods',
                rec_break_optimization: 'Take more frequent, shorter breaks to maintain focus',
                rec_task_prioritization: 'Use task prioritization methods like Eisenhower Matrix',
                rec_environment: 'Optimize your work environment for better concentration',
                rec_time_blocking: 'Use time blocking to allocate specific periods for different activities',
                rec_mindfulness: 'Practice mindfulness or meditation to improve focus',
                // Insights
                insight_focus_ratio: 'Your focus-to-break ratio suggests {ratio} productivity pattern',
                insight_distraction_impact: 'Distractions are significantly impacting your productivity',
                insight_energy_alignment: 'Your energy levels are well-aligned with your productivity',
                insight_satisfaction_correlation: 'Higher satisfaction correlates with better productivity',
                insight_task_completion: 'Your task completion rate indicates {level} efficiency',
                optimal: 'optimal',
                suboptimal: 'suboptimal',
                high: 'high',
                moderate: 'moderate',
                low: 'low'
            },
            es: {
                title: 'Calculadora de Productividad',
                description: 'Analiza tus patrones de productividad y obtén recomendaciones personalizadas para mejorar',
                timeframe_label: 'Marco Temporal',
                daily: 'Diario',
                weekly: 'Semanal',
                focus_time_label: 'Tiempo de Concentración (horas)',
                break_time_label: 'Tiempo de Descanso (horas)',
                tasks_completed_label: 'Tareas Completadas',
                distractions_label: 'Número de Distracciones',
                energy_level_label: 'Nivel de Energía (1-10)',
                satisfaction_level_label: 'Nivel de Satisfacción (1-10)',
                calculate_productivity: 'Calcular Productividad',
                your_productivity_score: 'Tu Puntuación de Productividad',
                productivity_level: 'Nivel de Productividad',
                recommendations: 'Recomendaciones',
                insights: 'Perspectivas Clave',
                recalculate: 'Recalcular',
                export_report: 'Exportar Reporte',
                report_exported: '¡Reporte de productividad exportado exitosamente!',
                // Productivity levels
                excellent: 'Excelente',
                good: 'Bueno',
                average: 'Promedio',
                needs_improvement: 'Necesita Mejora',
                poor: 'Deficiente',
                // Recommendations
                rec_pomodoro: 'Prueba la Técnica Pomodoro (25min concentración + 5min descanso)',
                rec_eliminate_distractions: 'Identifica y elimina tus principales fuentes de distracción',
                rec_energy_management: 'Programa tareas exigentes durante tus períodos de alta energía',
                rec_break_optimization: 'Toma descansos más frecuentes y cortos para mantener la concentración',
                rec_task_prioritization: 'Usa métodos de priorización como la Matriz de Eisenhower',
                rec_environment: 'Optimiza tu ambiente de trabajo para mejor concentración',
                rec_time_blocking: 'Usa bloques de tiempo para asignar períodos específicos a diferentes actividades',
                rec_mindfulness: 'Practica mindfulness o meditación para mejorar la concentración',
                // Insights
                insight_focus_ratio: 'Tu proporción concentración-descanso sugiere un patrón de productividad {ratio}',
                insight_distraction_impact: 'Las distracciones están impactando significativamente tu productividad',
                insight_energy_alignment: 'Tus niveles de energía están bien alineados con tu productividad',
                insight_satisfaction_correlation: 'Mayor satisfacción se correlaciona con mejor productividad',
                insight_task_completion: 'Tu tasa de finalización de tareas indica eficiencia {level}',
                optimal: 'óptimo',
                suboptimal: 'subóptimo',
                high: 'alta',
                moderate: 'moderada',
                low: 'baja'
            },
            pt: {
                title: 'Calculadora de Produtividade',
                description: 'Analise seus padrões de produtividade e obtenha recomendações personalizadas para melhoria',
                timeframe_label: 'Período de Tempo',
                daily: 'Diário',
                weekly: 'Semanal',
                focus_time_label: 'Tempo de Foco (horas)',
                break_time_label: 'Tempo de Pausa (horas)',
                tasks_completed_label: 'Tarefas Concluídas',
                distractions_label: 'Número de Distrações',
                energy_level_label: 'Nível de Energia (1-10)',
                satisfaction_level_label: 'Nível de Satisfação (1-10)',
                calculate_productivity: 'Calcular Produtividade',
                your_productivity_score: 'Sua Pontuação de Produtividade',
                productivity_level: 'Nível de Produtividade',
                recommendations: 'Recomendações',
                insights: 'Insights Principais',
                recalculate: 'Recalcular',
                export_report: 'Exportar Relatório',
                report_exported: 'Relatório de produtividade exportado com sucesso!',
                // Productivity levels
                excellent: 'Excelente',
                good: 'Bom',
                average: 'Médio',
                needs_improvement: 'Precisa Melhorar',
                poor: 'Ruim',
                // Recommendations
                rec_pomodoro: 'Experimente a Técnica Pomodoro (25min foco + 5min pausa)',
                rec_eliminate_distractions: 'Identifique e elimine suas principais fontes de distração',
                rec_energy_management: 'Agende tarefas exigentes durante seus períodos de alta energia',
                rec_break_optimization: 'Faça pausas mais frequentes e curtas para manter o foco',
                rec_task_prioritization: 'Use métodos de priorização como a Matriz de Eisenhower',
                rec_environment: 'Otimize seu ambiente de trabalho para melhor concentração',
                rec_time_blocking: 'Use bloqueio de tempo para alocar períodos específicos para diferentes atividades',
                rec_mindfulness: 'Pratique mindfulness ou meditação para melhorar o foco',
                // Insights
                insight_focus_ratio: 'Sua proporção foco-pausa sugere um padrão de produtividade {ratio}',
                insight_distraction_impact: 'Distrações estão impactando significativamente sua produtividade',
                insight_energy_alignment: 'Seus níveis de energia estão bem alinhados com sua produtividade',
                insight_satisfaction_correlation: 'Maior satisfação se correlaciona com melhor produtividade',
                insight_task_completion: 'Sua taxa de conclusão de tarefas indica eficiência {level}',
                optimal: 'ótimo',
                suboptimal: 'subótimo',
                high: 'alta',
                moderate: 'moderada',
                low: 'baixa'
            },
            fr: {
                title: 'Calculateur de Productivité',
                description: 'Analysez vos modèles de productivité et obtenez des recommandations personnalisées pour l\'amélioration',
                timeframe_label: 'Période',
                daily: 'Quotidien',
                weekly: 'Hebdomadaire',
                focus_time_label: 'Temps de Concentration (heures)',
                break_time_label: 'Temps de Pause (heures)',
                tasks_completed_label: 'Tâches Terminées',
                distractions_label: 'Nombre de Distractions',
                energy_level_label: 'Niveau d\'Énergie (1-10)',
                satisfaction_level_label: 'Niveau de Satisfaction (1-10)',
                calculate_productivity: 'Calculer la Productivité',
                your_productivity_score: 'Votre Score de Productivité',
                productivity_level: 'Niveau de Productivité',
                recommendations: 'Recommandations',
                insights: 'Insights Clés',
                recalculate: 'Recalculer',
                export_report: 'Exporter le Rapport',
                report_exported: 'Rapport de productivité exporté avec succès!',
                // Productivity levels
                excellent: 'Excellent',
                good: 'Bon',
                average: 'Moyen',
                needs_improvement: 'Nécessite une Amélioration',
                poor: 'Faible',
                // Recommendations
                rec_pomodoro: 'Essayez la Technique Pomodoro (25min concentration + 5min pause)',
                rec_eliminate_distractions: 'Identifiez et éliminez vos principales sources de distraction',
                rec_energy_management: 'Planifiez les tâches exigeantes pendant vos périodes de haute énergie',
                rec_break_optimization: 'Prenez des pauses plus fréquentes et courtes pour maintenir la concentration',
                rec_task_prioritization: 'Utilisez des méthodes de priorisation comme la Matrice d\'Eisenhower',
                rec_environment: 'Optimisez votre environnement de travail pour une meilleure concentration',
                rec_time_blocking: 'Utilisez le blocage de temps pour allouer des périodes spécifiques à différentes activités',
                rec_mindfulness: 'Pratiquez la pleine conscience ou la méditation pour améliorer la concentration',
                // Insights
                insight_focus_ratio: 'Votre ratio concentration-pause suggère un modèle de productivité {ratio}',
                insight_distraction_impact: 'Les distractions impactent significativement votre productivité',
                insight_energy_alignment: 'Vos niveaux d\'énergie sont bien alignés avec votre productivité',
                insight_satisfaction_correlation: 'Une satisfaction plus élevée est corrélée à une meilleure productivité',
                insight_task_completion: 'Votre taux de completion des tâches indique une efficacité {level}',
                optimal: 'optimal',
                suboptimal: 'sous-optimal',
                high: 'élevée',
                moderate: 'modérée',
                low: 'faible'
            }
        };
        return texts[locale]?.[key] || texts.en[key] || key;
    };

    const calculateProductivity = (): ProductivityResult => {
        const { focusTime, breakTime, tasksCompleted, distractions, energyLevel, satisfactionLevel } = metrics;
        
        // Calculate base score components
        const focusScore = Math.min((focusTime / (timeframe === 'day' ? 8 : 40)) * 100, 100);
        const taskScore = Math.min((tasksCompleted / (timeframe === 'day' ? 5 : 25)) * 100, 100);
        const distractionPenalty = Math.min(distractions * (timeframe === 'day' ? 5 : 2), 50);
        const energyScore = (energyLevel / 10) * 100;
        const satisfactionScore = (satisfactionLevel / 10) * 100;
        
        // Calculate weighted score
        const rawScore = (
            focusScore * 0.25 +
            taskScore * 0.25 +
            (100 - distractionPenalty) * 0.2 +
            energyScore * 0.15 +
            satisfactionScore * 0.15
        );
        
        const score = Math.round(Math.max(0, Math.min(100, rawScore)));
        
        // Determine productivity level
        let level: string;
        if (score >= 85) level = getLocalizedText('excellent');
        else if (score >= 70) level = getLocalizedText('good');
        else if (score >= 55) level = getLocalizedText('average');
        else if (score >= 40) level = getLocalizedText('needs_improvement');
        else level = getLocalizedText('poor');
        
        // Generate recommendations
        const recommendations: string[] = [];
        const insights: string[] = [];
        
        if (focusTime < (timeframe === 'day' ? 4 : 20)) {
            recommendations.push(getLocalizedText('rec_pomodoro'));
            recommendations.push(getLocalizedText('rec_time_blocking'));
        }
        
        if (distractions > (timeframe === 'day' ? 5 : 20)) {
            recommendations.push(getLocalizedText('rec_eliminate_distractions'));
            recommendations.push(getLocalizedText('rec_environment'));
            insights.push(getLocalizedText('insight_distraction_impact'));
        }
        
        if (energyLevel < 6) {
            recommendations.push(getLocalizedText('rec_energy_management'));
            recommendations.push(getLocalizedText('rec_break_optimization'));
        } else {
            insights.push(getLocalizedText('insight_energy_alignment'));
        }
        
        if (satisfactionLevel >= 7) {
            insights.push(getLocalizedText('insight_satisfaction_correlation'));
        }
        
        if (taskScore < 60) {
            recommendations.push(getLocalizedText('rec_task_prioritization'));
            insights.push(getLocalizedText('insight_task_completion').replace('{level}', getLocalizedText('low')));
        } else if (taskScore >= 80) {
            insights.push(getLocalizedText('insight_task_completion').replace('{level}', getLocalizedText('high')));
        } else {
            insights.push(getLocalizedText('insight_task_completion').replace('{level}', getLocalizedText('moderate')));
        }
        
        if (focusTime > 0 && breakTime > 0) {
            const ratio = focusTime / breakTime;
            const ratioText = ratio > 4 ? getLocalizedText('suboptimal') : getLocalizedText('optimal');
            insights.push(getLocalizedText('insight_focus_ratio').replace('{ratio}', ratioText));
        }
        
        if (score < 70) {
            recommendations.push(getLocalizedText('rec_mindfulness'));
        }
        
        return { score, level, recommendations: recommendations.slice(0, 4), insights: insights.slice(0, 3) };
    };

    const handleCalculate = () => {
        const productivityResult = calculateProductivity();
        setResult(productivityResult);
    };

    const exportReport = () => {
        if (!result) return;
        
        const report = {
            date: new Date().toISOString().split('T')[0],
            timeframe,
            metrics,
            result
        };
        
        const reportText = `Productivity Report - ${report.date}\n\n` +
            `Time Frame: ${getLocalizedText(timeframe)}\n` +
            `Score: ${result.score}/100\n` +
            `Level: ${result.level}\n\n` +
            `Metrics:\n` +
            `- Focus Time: ${metrics.focusTime} hours\n` +
            `- Break Time: ${metrics.breakTime} hours\n` +
            `- Tasks Completed: ${metrics.tasksCompleted}\n` +
            `- Distractions: ${metrics.distractions}\n` +
            `- Energy Level: ${metrics.energyLevel}/10\n` +
            `- Satisfaction Level: ${metrics.satisfactionLevel}/10\n\n` +
            `Recommendations:\n${result.recommendations.map(rec => `- ${rec}`).join('\n')}\n\n` +
            `Insights:\n${result.insights.map(insight => `- ${insight}`).join('\n')}`;
        
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity-report-${report.date}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(getLocalizedText('report_exported'));
    };

    const updateMetric = (key: keyof ProductivityMetrics, value: number) => {
        setMetrics({ ...metrics, [key]: value });
    };

    return (
        <Layout>
            <Head title={getLocalizedText('title')} />
            
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            {getLocalizedText('title')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {getLocalizedText('description')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Form */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {getLocalizedText('timeframe_label')}
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="day"
                                            checked={timeframe === 'day'}
                                            onChange={(e) => setTimeframe(e.target.value as 'day' | 'week')}
                                            className="mr-2"
                                        />
                                        {getLocalizedText('daily')}
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="week"
                                            checked={timeframe === 'week'}
                                            onChange={(e) => setTimeframe(e.target.value as 'day' | 'week')}
                                            className="mr-2"
                                        />
                                        {getLocalizedText('weekly')}
                                    </label>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('focus_time_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.focusTime}
                                        onChange={(e) => updateMetric('focusTime', Number(e.target.value))}
                                        min="0"
                                        max={timeframe === 'day' ? "16" : "80"}
                                        step="0.5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('break_time_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.breakTime}
                                        onChange={(e) => updateMetric('breakTime', Number(e.target.value))}
                                        min="0"
                                        max={timeframe === 'day' ? "8" : "40"}
                                        step="0.25"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('tasks_completed_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.tasksCompleted}
                                        onChange={(e) => updateMetric('tasksCompleted', Number(e.target.value))}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('distractions_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.distractions}
                                        onChange={(e) => updateMetric('distractions', Number(e.target.value))}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('energy_level_label')}
                                    </label>
                                    <input
                                        type="range"
                                        value={metrics.energyLevel}
                                        onChange={(e) => updateMetric('energyLevel', Number(e.target.value))}
                                        min="1"
                                        max="10"
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                                        <span>1</span>
                                        <span className="font-medium">{metrics.energyLevel}</span>
                                        <span>10</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('satisfaction_level_label')}
                                    </label>
                                    <input
                                        type="range"
                                        value={metrics.satisfactionLevel}
                                        onChange={(e) => updateMetric('satisfactionLevel', Number(e.target.value))}
                                        min="1"
                                        max="10"
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                                        <span>1</span>
                                        <span className="font-medium">{metrics.satisfactionLevel}</span>
                                        <span>10</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleCalculate}
                                className="w-full mt-6 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                            >
                                {getLocalizedText('calculate_productivity')}
                            </button>
                        </div>

                        {/* Results */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            {result ? (
                                <div>
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                            {getLocalizedText('your_productivity_score')}
                                        </h2>
                                        <div className="relative w-32 h-32 mx-auto mb-4">
                                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                                <circle
                                                    cx="60"
                                                    cy="60"
                                                    r="50"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="8"
                                                    fill="none"
                                                />
                                                <circle
                                                    cx="60"
                                                    cy="60"
                                                    r="50"
                                                    stroke={result.score >= 70 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444'}
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={`${(result.score / 100) * 314} 314`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-gray-900">{result.score}</span>
                                            </div>
                                        </div>
                                        <div className={`inline-block px-4 py-2 rounded-full text-white font-medium ${
                                            result.score >= 85 ? 'bg-green-500' :
                                            result.score >= 70 ? 'bg-blue-500' :
                                            result.score >= 55 ? 'bg-yellow-500' :
                                            result.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}>
                                            {result.level}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                                                {getLocalizedText('recommendations')}
                                            </h3>
                                            <ul className="space-y-2">
                                                {result.recommendations.map((rec, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                                            {index + 1}
                                                        </span>
                                                        <span className="text-gray-700 text-sm">{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        {result.insights.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                                    {getLocalizedText('insights')}
                                                </h3>
                                                <ul className="space-y-2">
                                                    {result.insights.map((insight, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className="bg-blue-500 text-white rounded-full w-2 h-2 mr-3 mt-2"></span>
                                                            <span className="text-gray-700 text-sm">{insight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex space-x-4 mt-8">
                                        <button
                                            onClick={() => setResult(null)}
                                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            {getLocalizedText('recalculate')}
                                        </button>
                                        <button
                                            onClick={exportReport}
                                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            {getLocalizedText('export_report')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {getLocalizedText('calculate_productivity')}
                                    </h3>
                                    <p className="text-gray-600">
                                        Fill in your productivity metrics to get your personalized analysis.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProductivityCalculator;