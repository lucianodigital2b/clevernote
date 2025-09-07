import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';

interface FlashcardCreatorProps {
    locale: string;
}

interface Flashcard {
    id: string;
    front: string;
    back: string;
    category: string;
}

const FlashcardCreator: React.FC<FlashcardCreatorProps> = ({ locale }) => {
    const { t } = useTranslation();
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentCard, setCurrentCard] = useState({ front: '', back: '', category: '' });
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [studyMode, setStudyMode] = useState<boolean>(false);
    const [currentStudyIndex, setCurrentStudyIndex] = useState<number>(0);
    const [showAnswer, setShowAnswer] = useState<boolean>(false);

    const getLocalizedText = (key: string) => {
        const texts: Record<string, Record<string, string>> = {
            en: {
                title: 'Flashcard Creator',
                description: 'Create and study with digital flashcards to improve your learning efficiency',
                front_label: 'Front (Question/Term)',
                back_label: 'Back (Answer/Definition)',
                category_label: 'Category',
                category_placeholder: 'e.g., Vocabulary, Math, Science',
                add_card: 'Add Flashcard',
                your_flashcards: 'Your Flashcards',
                study_mode: 'Study Mode',
                exit_study: 'Exit Study Mode',
                show_answer: 'Show Answer',
                next_card: 'Next Card',
                previous_card: 'Previous Card',
                filter_category: 'Filter by Category',
                all_categories: 'All Categories',
                export_cards: 'Export Cards',
                import_cards: 'Import Cards',
                delete_card: 'Delete',
                edit_card: 'Edit',
                cards_exported: 'Flashcards exported successfully!',
                no_cards: 'No flashcards yet. Create your first one!',
                card_of: 'Card {current} of {total}',
                study_complete: 'Study session complete! Great job!',
                restart_study: 'Restart Study Session'
            },
            es: {
                title: 'Creador de Tarjetas de Estudio',
                description: 'Crea y estudia con tarjetas digitales para mejorar tu eficiencia de aprendizaje',
                front_label: 'Frente (Pregunta/Término)',
                back_label: 'Reverso (Respuesta/Definición)',
                category_label: 'Categoría',
                category_placeholder: 'ej., Vocabulario, Matemáticas, Ciencias',
                add_card: 'Agregar Tarjeta',
                your_flashcards: 'Tus Tarjetas de Estudio',
                study_mode: 'Modo de Estudio',
                exit_study: 'Salir del Modo de Estudio',
                show_answer: 'Mostrar Respuesta',
                next_card: 'Siguiente Tarjeta',
                previous_card: 'Tarjeta Anterior',
                filter_category: 'Filtrar por Categoría',
                all_categories: 'Todas las Categorías',
                export_cards: 'Exportar Tarjetas',
                import_cards: 'Importar Tarjetas',
                delete_card: 'Eliminar',
                edit_card: 'Editar',
                cards_exported: '¡Tarjetas exportadas exitosamente!',
                no_cards: 'No hay tarjetas aún. ¡Crea tu primera!',
                card_of: 'Tarjeta {current} de {total}',
                study_complete: '¡Sesión de estudio completa! ¡Buen trabajo!',
                restart_study: 'Reiniciar Sesión de Estudio'
            },
            pt: {
                title: 'Criador de Flashcards',
                description: 'Crie e estude com flashcards digitais para melhorar sua eficiência de aprendizado',
                front_label: 'Frente (Pergunta/Termo)',
                back_label: 'Verso (Resposta/Definição)',
                category_label: 'Categoria',
                category_placeholder: 'ex., Vocabulário, Matemática, Ciências',
                add_card: 'Adicionar Flashcard',
                your_flashcards: 'Seus Flashcards',
                study_mode: 'Modo de Estudo',
                exit_study: 'Sair do Modo de Estudo',
                show_answer: 'Mostrar Resposta',
                next_card: 'Próximo Card',
                previous_card: 'Card Anterior',
                filter_category: 'Filtrar por Categoria',
                all_categories: 'Todas as Categorias',
                export_cards: 'Exportar Cards',
                import_cards: 'Importar Cards',
                delete_card: 'Excluir',
                edit_card: 'Editar',
                cards_exported: 'Flashcards exportados com sucesso!',
                no_cards: 'Nenhum flashcard ainda. Crie seu primeiro!',
                card_of: 'Card {current} de {total}',
                study_complete: 'Sessão de estudo completa! Ótimo trabalho!',
                restart_study: 'Reiniciar Sessão de Estudo'
            },
            fr: {
                title: 'Créateur de Cartes Mémoire',
                description: 'Créez et étudiez avec des cartes mémoire numériques pour améliorer votre efficacité d\'apprentissage',
                front_label: 'Recto (Question/Terme)',
                back_label: 'Verso (Réponse/Définition)',
                category_label: 'Catégorie',
                category_placeholder: 'ex., Vocabulaire, Mathématiques, Sciences',
                add_card: 'Ajouter une Carte',
                your_flashcards: 'Vos Cartes Mémoire',
                study_mode: 'Mode d\'Étude',
                exit_study: 'Quitter le Mode d\'Étude',
                show_answer: 'Montrer la Réponse',
                next_card: 'Carte Suivante',
                previous_card: 'Carte Précédente',
                filter_category: 'Filtrer par Catégorie',
                all_categories: 'Toutes les Catégories',
                export_cards: 'Exporter les Cartes',
                import_cards: 'Importer les Cartes',
                delete_card: 'Supprimer',
                edit_card: 'Modifier',
                cards_exported: 'Cartes mémoire exportées avec succès!',
                no_cards: 'Aucune carte mémoire encore. Créez votre première!',
                card_of: 'Carte {current} sur {total}',
                study_complete: 'Session d\'étude terminée! Excellent travail!',
                restart_study: 'Redémarrer la Session d\'Étude'
            }
        };
        return texts[locale]?.[key] || texts.en[key] || key;
    };

    const addFlashcard = () => {
        if (currentCard.front.trim() && currentCard.back.trim()) {
            const newCard: Flashcard = {
                id: Date.now().toString(),
                front: currentCard.front.trim(),
                back: currentCard.back.trim(),
                category: currentCard.category.trim() || 'General'
            };
            setFlashcards([...flashcards, newCard]);
            setCurrentCard({ front: '', back: '', category: '' });
        }
    };

    const deleteFlashcard = (id: string) => {
        setFlashcards(flashcards.filter(card => card.id !== id));
    };

    const getFilteredCards = () => {
        if (selectedCategory === 'all') {
            return flashcards;
        }
        return flashcards.filter(card => card.category === selectedCategory);
    };

    const getCategories = () => {
        const categories = [...new Set(flashcards.map(card => card.category))];
        return categories;
    };

    const startStudyMode = () => {
        const filtered = getFilteredCards();
        if (filtered.length > 0) {
            setStudyMode(true);
            setCurrentStudyIndex(0);
            setShowAnswer(false);
        }
    };

    const nextCard = () => {
        const filtered = getFilteredCards();
        if (currentStudyIndex < filtered.length - 1) {
            setCurrentStudyIndex(currentStudyIndex + 1);
            setShowAnswer(false);
        }
    };

    const previousCard = () => {
        if (currentStudyIndex > 0) {
            setCurrentStudyIndex(currentStudyIndex - 1);
            setShowAnswer(false);
        }
    };

    const exportFlashcards = () => {
        const dataStr = JSON.stringify(flashcards, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flashcards.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert(getLocalizedText('cards_exported'));
    };

    const filteredCards = getFilteredCards();
    const currentStudyCard = filteredCards[currentStudyIndex];

    if (studyMode) {
        return (
            <AppLayout>
                <Head title={getLocalizedText('title')} />
                
                <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <button
                                onClick={() => setStudyMode(false)}
                                className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                {getLocalizedText('exit_study')}
                            </button>
                            <p className="text-lg text-gray-600">
                                {getLocalizedText('card_of').replace('{current}', (currentStudyIndex + 1).toString()).replace('{total}', filteredCards.length.toString())}
                            </p>
                        </div>

                        {currentStudyCard ? (
                            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 min-h-[300px] flex flex-col justify-center">
                                <div className="text-center">
                                    <div className="mb-6">
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {currentStudyCard.category}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                            {currentStudyCard.front}
                                        </h2>
                                        
                                        {showAnswer && (
                                            <div className="mt-6 p-4 bg-green-50 rounded-lg">
                                                <p className="text-lg text-gray-800">
                                                    {currentStudyCard.back}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-center space-x-4">
                                        {!showAnswer ? (
                                            <button
                                                onClick={() => setShowAnswer(true)}
                                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                {getLocalizedText('show_answer')}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={previousCard}
                                                    disabled={currentStudyIndex === 0}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {getLocalizedText('previous_card')}
                                                </button>
                                                <button
                                                    onClick={nextCard}
                                                    disabled={currentStudyIndex === filteredCards.length - 1}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {getLocalizedText('next_card')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    {getLocalizedText('study_complete')}
                                </h2>
                                <button
                                    onClick={() => {
                                        setCurrentStudyIndex(0);
                                        setShowAnswer(false);
                                    }}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    {getLocalizedText('restart_study')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={getLocalizedText('title')} />
            
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12">
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
                        {/* Create Card Form */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {getLocalizedText('add_card')}
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('front_label')}
                                    </label>
                                    <textarea
                                        value={currentCard.front}
                                        onChange={(e) => setCurrentCard({ ...currentCard, front: e.target.value })}
                                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('back_label')}
                                    </label>
                                    <textarea
                                        value={currentCard.back}
                                        onChange={(e) => setCurrentCard({ ...currentCard, back: e.target.value })}
                                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {getLocalizedText('category_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={currentCard.category}
                                        onChange={(e) => setCurrentCard({ ...currentCard, category: e.target.value })}
                                        placeholder={getLocalizedText('category_placeholder')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <button
                                    onClick={addFlashcard}
                                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                >
                                    {getLocalizedText('add_card')}
                                </button>
                            </div>
                        </div>

                        {/* Cards List */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {getLocalizedText('your_flashcards')} ({flashcards.length})
                                </h2>
                                
                                <div className="flex space-x-2">
                                    {flashcards.length > 0 && (
                                        <>
                                            <button
                                                onClick={startStudyMode}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            >
                                                {getLocalizedText('study_mode')}
                                            </button>
                                            <button
                                                onClick={exportFlashcards}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                {getLocalizedText('export_cards')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {getCategories().length > 0 && (
                                <div className="mb-4">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="all">{getLocalizedText('all_categories')}</option>
                                        {getCategories().map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {filteredCards.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                        {getLocalizedText('no_cards')}
                                    </p>
                                ) : (
                                    filteredCards.map(card => (
                                        <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {card.category}
                                                </span>
                                                <button
                                                    onClick={() => deleteFlashcard(card.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    {getLocalizedText('delete_card')}
                                                </button>
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900 mb-1">
                                                    {card.front}
                                                </div>
                                                <div className="text-gray-600">
                                                    {card.back}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default FlashcardCreator;