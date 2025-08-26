import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Zap, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import ToolCard from '@/components/ToolCard';

interface Tool {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  icon: string;
  category: string;
  featured: boolean;
  difficulty: string;
  estimatedTime: number;
}

interface ToolsIndexProps {
  tools: Tool[];
  locale: string;
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
}

const ToolsIndex: React.FC<ToolsIndexProps> = ({ tools, locale, meta }) => {


  const getTexts = () => {
    const texts = {
      en: {
        pageTitle: 'Free Productivity Tools',
        pageSubtitle: 'Enhance your learning and productivity with our collection of free tools designed to optimize your note-taking and study experience.',
        featuredTools: 'Featured Tools',
        allTools: 'All Tools',
        categories: {
          templates: 'Templates',
          planning: 'Planning',
          study: 'Study',
          assessment: 'Assessment',
          productivity: 'Productivity'
        },
        difficulty: {
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced'
        },
        estimatedTime: 'min',
        tryTool: 'Try Tool',
        benefits: 'Benefits',
        getStarted: 'Get Started with CleverNote',
        getStartedDesc: 'Ready to take your productivity to the next level? Join thousands of users who are already optimizing their learning with CleverNote.',
        signUpFree: 'Sign Up Free',
        learnMore: 'Learn More',
        whyUseTools: 'Why Use Our Tools?',
        toolBenefits: [
          {
            icon: 'Zap',
            title: 'Instant Results',
            description: 'Get immediate value with tools that work right out of the box'
          },
          {
            icon: 'Target',
            title: 'Focused Learning',
            description: 'Each tool is designed to solve specific productivity challenges'
          },
          {
            icon: 'TrendingUp',
            title: 'Proven Methods',
            description: 'Based on research-backed learning and productivity techniques'
          }
        ]
      },
      es: {
        pageTitle: 'Herramientas Gratuitas de Productividad',
        pageSubtitle: 'Mejora tu aprendizaje y productividad con nuestra colección de herramientas gratuitas diseñadas para optimizar tu experiencia de toma de notas y estudio.',
        featuredTools: 'Herramientas Destacadas',
        allTools: 'Todas las Herramientas',
        categories: {
          templates: 'Plantillas',
          planning: 'Planificación',
          study: 'Estudio',
          assessment: 'Evaluación',
          productivity: 'Productividad'
        },
        difficulty: {
          beginner: 'Principiante',
          intermediate: 'Intermedio',
          advanced: 'Avanzado'
        },
        estimatedTime: 'min',
        tryTool: 'Probar Herramienta',
        benefits: 'Beneficios',
        getStarted: 'Comienza con CleverNote',
        getStartedDesc: '¿Listo para llevar tu productividad al siguiente nivel? Únete a miles de usuarios que ya están optimizando su aprendizaje con CleverNote.',
        signUpFree: 'Registrarse Gratis',
        learnMore: 'Saber Más',
        whyUseTools: '¿Por Qué Usar Nuestras Herramientas?',
        toolBenefits: [
          {
            icon: 'Zap',
            title: 'Resultados Instantáneos',
            description: 'Obtén valor inmediato con herramientas que funcionan desde el primer momento'
          },
          {
            icon: 'Target',
            title: 'Aprendizaje Enfocado',
            description: 'Cada herramienta está diseñada para resolver desafíos específicos de productividad'
          },
          {
            icon: 'TrendingUp',
            title: 'Métodos Probados',
            description: 'Basado en técnicas de aprendizaje y productividad respaldadas por investigación'
          }
        ]
      },
      pt: {
        pageTitle: 'Ferramentas Gratuitas de Produtividade',
        pageSubtitle: 'Melhore seu aprendizado e produtividade com nossa coleção de ferramentas gratuitas projetadas para otimizar sua experiência de anotações e estudos.',
        featuredTools: 'Ferramentas em Destaque',
        allTools: 'Todas as Ferramentas',
        categories: {
          templates: 'Modelos',
          planning: 'Planejamento',
          study: 'Estudo',
          assessment: 'Avaliação',
          productivity: 'Produtividade'
        },
        difficulty: {
          beginner: 'Iniciante',
          intermediate: 'Intermediário',
          advanced: 'Avançado'
        },
        estimatedTime: 'min',
        tryTool: 'Experimentar Ferramenta',
        benefits: 'Benefícios',
        getStarted: 'Comece com CleverNote',
        getStartedDesc: 'Pronto para levar sua produtividade para o próximo nível? Junte-se a milhares de usuários que já estão otimizando seu aprendizado com CleverNote.',
        signUpFree: 'Cadastre-se Grátis',
        learnMore: 'Saiba Mais',
        whyUseTools: 'Por Que Usar Nossas Ferramentas?',
        toolBenefits: [
          {
            icon: 'Zap',
            title: 'Resultados Instantâneos',
            description: 'Obtenha valor imediato com ferramentas que funcionam desde o início'
          },
          {
            icon: 'Target',
            title: 'Aprendizado Focado',
            description: 'Cada ferramenta é projetada para resolver desafios específicos de produtividade'
          },
          {
            icon: 'TrendingUp',
            title: 'Métodos Comprovados',
            description: 'Baseado em técnicas de aprendizado e produtividade apoiadas por pesquisa'
          }
        ]
      },
      fr: {
        pageTitle: 'Outils Gratuits de Productivité',
        pageSubtitle: 'Améliorez votre apprentissage et productivité avec notre collection d\'outils gratuits conçus pour optimiser votre expérience de prise de notes et d\'étude.',
        featuredTools: 'Outils en Vedette',
        allTools: 'Tous les Outils',
        categories: {
          templates: 'Modèles',
          planning: 'Planification',
          study: 'Étude',
          assessment: 'Évaluation',
          productivity: 'Productivité'
        },
        difficulty: {
          beginner: 'Débutant',
          intermediate: 'Intermédiaire',
          advanced: 'Avancé'
        },
        estimatedTime: 'min',
        tryTool: 'Essayer l\'Outil',
        benefits: 'Avantages',
        getStarted: 'Commencer avec CleverNote',
        getStartedDesc: 'Prêt à porter votre productivité au niveau supérieur ? Rejoignez des milliers d\'utilisateurs qui optimisent déjà leur apprentissage avec CleverNote.',
        signUpFree: 'S\'inscrire Gratuitement',
        learnMore: 'En Savoir Plus',
        whyUseTools: 'Pourquoi Utiliser Nos Outils ?',
        toolBenefits: [
          {
            icon: 'Zap',
            title: 'Résultats Instantanés',
            description: 'Obtenez une valeur immédiate avec des outils qui fonctionnent dès le départ'
          },
          {
            icon: 'Target',
            title: 'Apprentissage Ciblé',
            description: 'Chaque outil est conçu pour résoudre des défis spécifiques de productivité'
          },
          {
            icon: 'TrendingUp',
            title: 'Méthodes Éprouvées',
            description: 'Basé sur des techniques d\'apprentissage et de productivité soutenues par la recherche'
          }
        ]
      }
    };
    return texts[locale as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();
  const featuredTools = tools.filter(tool => tool.featured);
  const allTools = tools;





  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`/tools/${locale}`} />
      </Head>

      <div className="min-h-screen bg-white">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                {texts.pageTitle}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {texts.pageSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Why Use Our Tools */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                {texts.whyUseTools}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {texts.toolBenefits.map((benefit, index) => {
                  const IconComponent = benefit.icon === 'Zap' ? Zap : benefit.icon === 'Target' ? Target : TrendingUp;
                  return (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                        <IconComponent className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Tools */}
        {featuredTools.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                  {texts.featuredTools}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredTools.map((tool) => (
                    <ToolCard 
                      key={tool.id} 
                      title={tool.title}
                      description={tool.description}
                      icon={tool.icon}
                      href={tool.href}
                      featured={true}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Tools */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                {texts.allTools}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allTools.map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    title={tool.title}
                    description={tool.description}
                    icon={tool.icon}
                    href={tool.href}
                    featured={tool.featured}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-indigo-600">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {texts.getStarted}
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                {texts.getStartedDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/register/${locale}`}>
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                    {texts.signUpFree}
                  </Button>
                </Link>
                <Link href={`/${locale}`}>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                    {texts.learnMore}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default ToolsIndex;