import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Layout from '@/layouts/Layout';

interface StudySchedulePlannerProps {
    locale: string;
}

interface StudySession {
    id: string;
    subject: string;
    duration: number;
    priority: 'high' | 'medium' | 'low';
    type: 'review' | 'new' | 'practice';
}

const StudySchedulePlanner: React.FC<StudySchedulePlannerProps> = ({ locale }) => {
    const { t } = useTranslation();
    const [subjects, setSubjects] = useState<string>('');
    const [studyHours, setStudyHours] = useState<number>(4);
    const [breakDuration, setBreakDuration] = useState<number>(15);
    const [schedule, setSchedule] = useState<StudySession[]>([]);
    const [startTime, setStartTime] = useState<string>('09:00');

    const getLocalizedText = (key: string) => {
        const texts: Record<string, Record<string, string>> = {
            en: {
                title: 'Study Schedule Planner',
                description: 'Create an optimized study schedule based on your subjects and available time',
                subjects_label: 'Subjects (one per line)',
                subjects_placeholder: 'Mathematics\nPhysics\nChemistry\nBiology',
                study_hours_label: 'Total Study Hours',
                break_duration_label: 'Break Duration (minutes)',
                start_time_label: 'Start Time',
                generate_schedule: 'Generate Schedule',
                your_schedule: 'Your Study Schedule',
                subject: 'Subject',
                time: 'Time',
                duration: 'Duration',
                type: 'Type',
                priority: 'Priority',
                copy_schedule: 'Copy Schedule',
                download_schedule: 'Download Schedule',
                schedule_copied: 'Schedule copied to clipboard!',
                high: 'High',
                medium: 'Medium',
                low: 'Low',
                review: 'Review',
                new: 'New Material',
                practice: 'Practice'
            },
            es: {
                title: 'Planificador de Horario de Estudio',
                description: 'Crea un horario de estudio optimizado basado en tus materias y tiempo disponible',
                subjects_label: 'Materias (una por línea)',
                subjects_placeholder: 'Matemáticas\nFísica\nQuímica\nBiología',
                study_hours_label: 'Horas Totales de Estudio',
                break_duration_label: 'Duración del Descanso (minutos)',
                start_time_label: 'Hora de Inicio',
                generate_schedule: 'Generar Horario',
                your_schedule: 'Tu Horario de Estudio',
                subject: 'Materia',
                time: 'Hora',
                duration: 'Duración',
                type: 'Tipo',
                priority: 'Prioridad',
                copy_schedule: 'Copiar Horario',
                download_schedule: 'Descargar Horario',
                schedule_copied: '¡Horario copiado al portapapeles!',
                high: 'Alta',
                medium: 'Media',
                low: 'Baja',
                review: 'Repaso',
                new: 'Material Nuevo',
                practice: 'Práctica'
            },
            pt: {
                title: 'Planejador de Cronograma de Estudos',
                description: 'Crie um cronograma de estudos otimizado baseado em suas matérias e tempo disponível',
                subjects_label: 'Matérias (uma por linha)',
                subjects_placeholder: 'Matemática\nFísica\nQuímica\nBiologia',
                study_hours_label: 'Horas Totais de Estudo',
                break_duration_label: 'Duração do Intervalo (minutos)',
                start_time_label: 'Horário de Início',
                generate_schedule: 'Gerar Cronograma',
                your_schedule: 'Seu Cronograma de Estudos',
                subject: 'Matéria',
                time: 'Horário',
                duration: 'Duração',
                type: 'Tipo',
                priority: 'Prioridade',
                copy_schedule: 'Copiar Cronograma',
                download_schedule: 'Baixar Cronograma',
                schedule_copied: 'Cronograma copiado para a área de transferência!',
                high: 'Alta',
                medium: 'Média',
                low: 'Baixa',
                review: 'Revisão',
                new: 'Material Novo',
                practice: 'Prática'
            },
            fr: {
                title: 'Planificateur d\'Horaire d\'Étude',
                description: 'Créez un horaire d\'étude optimisé basé sur vos matières et votre temps disponible',
                subjects_label: 'Matières (une par ligne)',
                subjects_placeholder: 'Mathématiques\nPhysique\nChimie\nBiologie',
                study_hours_label: 'Heures Totales d\'Étude',
                break_duration_label: 'Durée de la Pause (minutes)',
                start_time_label: 'Heure de Début',
                generate_schedule: 'Générer l\'Horaire',
                your_schedule: 'Votre Horaire d\'Étude',
                subject: 'Matière',
                time: 'Heure',
                duration: 'Durée',
                type: 'Type',
                priority: 'Priorité',
                copy_schedule: 'Copier l\'Horaire',
                download_schedule: 'Télécharger l\'Horaire',
                schedule_copied: 'Horaire copié dans le presse-papiers!',
                high: 'Haute',
                medium: 'Moyenne',
                low: 'Basse',
                review: 'Révision',
                new: 'Nouveau Matériel',
                practice: 'Pratique'
            }
        };
        return texts[locale]?.[key] || texts.en[key] || key;
    };

    const generateSchedule = () => {
        const subjectList = subjects.split('\n').filter(s => s.trim());
        if (subjectList.length === 0) return;

        const totalMinutes = studyHours * 60;
        const sessionDuration = Math.floor(totalMinutes / subjectList.length);
        const sessions: StudySession[] = [];
        
        let currentTime = new Date(`2024-01-01 ${startTime}:00`);
        
        subjectList.forEach((subject, index) => {
            const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
            const types: ('review' | 'new' | 'practice')[] = ['review', 'new', 'practice'];
            
            sessions.push({
                id: `session-${index}`,
                subject: subject.trim(),
                duration: sessionDuration,
                priority: priorities[index % 3],
                type: types[index % 3]
            });
            
            currentTime = new Date(currentTime.getTime() + sessionDuration * 60000 + breakDuration * 60000);
        });
        
        setSchedule(sessions);
    };

    const copySchedule = async () => {
        const scheduleText = schedule.map((session, index) => {
            const startTime = new Date(`2024-01-01 ${document.querySelector('input[type="time"]')?.value || '09:00'}:00`);
            const sessionStart = new Date(startTime.getTime() + index * (session.duration + breakDuration) * 60000);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
            
            return `${sessionStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${sessionEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}: ${session.subject} (${session.duration}min) - ${getLocalizedText(session.type)} - ${getLocalizedText(session.priority)}`;
        }).join('\n');
        
        await navigator.clipboard.writeText(scheduleText);
        alert(getLocalizedText('schedule_copied'));
    };

    const downloadSchedule = () => {
        const scheduleText = schedule.map((session, index) => {
            const startTime = new Date(`2024-01-01 ${document.querySelector('input[type="time"]')?.value || '09:00'}:00`);
            const sessionStart = new Date(startTime.getTime() + index * (session.duration + breakDuration) * 60000);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
            
            return `${sessionStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${sessionEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}: ${session.subject} (${session.duration}min) - ${getLocalizedText(session.type)} - ${getLocalizedText(session.priority)}`;
        }).join('\n');
        
        const blob = new Blob([scheduleText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study-schedule.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Layout>
            <Head title={getLocalizedText('title')} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            {getLocalizedText('title')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {getLocalizedText('description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {getLocalizedText('subjects_label')}
                                </label>
                                <textarea
                                    value={subjects}
                                    onChange={(e) => setSubjects(e.target.value)}
                                    placeholder={getLocalizedText('subjects_placeholder')}
                                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('study_hours_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={studyHours}
                                        onChange={(e) => setStudyHours(Number(e.target.value))}
                                        min="1"
                                        max="12"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('break_duration_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={breakDuration}
                                        onChange={(e) => setBreakDuration(Number(e.target.value))}
                                        min="5"
                                        max="60"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('start_time_label')}
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={generateSchedule}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            {getLocalizedText('generate_schedule')}
                        </button>
                    </div>

                    {schedule.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {getLocalizedText('your_schedule')}
                                </h2>
                                <div className="space-x-4">
                                    <button
                                        onClick={copySchedule}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        {getLocalizedText('copy_schedule')}
                                    </button>
                                    <button
                                        onClick={downloadSchedule}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        {getLocalizedText('download_schedule')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">
                                                {getLocalizedText('time')}
                                            </th>
                                            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">
                                                {getLocalizedText('subject')}
                                            </th>
                                            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">
                                                {getLocalizedText('duration')}
                                            </th>
                                            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">
                                                {getLocalizedText('type')}
                                            </th>
                                            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">
                                                {getLocalizedText('priority')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedule.map((session, index) => {
                                            const sessionStart = new Date(`2024-01-01 ${startTime}:00`);
                                            sessionStart.setMinutes(sessionStart.getMinutes() + index * (session.duration + breakDuration));
                                            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
                                            
                                            return (
                                                <tr key={session.id} className="hover:bg-gray-50">
                                                    <td className="border border-gray-200 px-4 py-3">
                                                        {sessionStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - 
                                                        {sessionEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-3 font-medium">
                                                        {session.subject}
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-3">
                                                        {session.duration} min
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            session.type === 'review' ? 'bg-blue-100 text-blue-800' :
                                                            session.type === 'new' ? 'bg-green-100 text-green-800' :
                                                            'bg-orange-100 text-orange-800'
                                                        }`}>
                                                            {getLocalizedText(session.type)}
                                                        </span>
                                                    </td>
                                                    <td className="border border-gray-200 px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            session.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                            session.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {getLocalizedText(session.priority)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default StudySchedulePlanner;