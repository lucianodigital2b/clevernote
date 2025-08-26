import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed Card components to avoid dark mode styling
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  reading_time: number;
  category: string;
  tags: string[];
}

interface BlogIndexProps {
  posts: BlogPost[];
  locale: string;
  meta: {
    title: string;
    description: string;
  };
}

const BlogIndex: React.FC<BlogIndexProps> = ({ posts, locale, meta }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : locale === 'pt' ? 'pt-BR' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTimeText = (minutes: number) => {
    const texts = {
      en: `${minutes} min read`,
      es: `${minutes} min de lectura`,
      pt: `${minutes} min de leitura`,
      fr: `${minutes} min de lecture`
    };
    return texts[locale as keyof typeof texts] || texts.en;
  };

  const getHeaderTexts = () => {
    const texts = {
      en: {
        title: 'CleverNote Blog',
        subtitle: 'Study tips, note-taking techniques, and learning strategies to boost your academic performance',
        latestPosts: 'Latest Posts'
      },
      es: {
        title: 'Blog CleverNote',
        subtitle: 'Consejos de estudio, técnicas para tomar notas y estrategias de aprendizaje para mejorar tu rendimiento académico',
        latestPosts: 'Últimas Publicaciones'
      },
      pt: {
        title: 'Blog CleverNote',
        subtitle: 'Dicas de estudo, técnicas de anotações e estratégias de aprendizagem para melhorar seu desempenho acadêmico',
        latestPosts: 'Últimas Postagens'
      },
      fr: {
        title: 'Blog CleverNote',
        subtitle: 'Conseils d\'étude, techniques de prise de notes et stratégies d\'apprentissage pour améliorer vos performances académiques',
        latestPosts: 'Derniers Articles'
      }
    };
    return texts[locale as keyof typeof texts] || texts.en;
  };

  const headerTexts = getHeaderTexts();

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`/blog/${locale}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {headerTexts.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {headerTexts.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                {headerTexts.latestPosts}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <div key={post.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white rounded-lg overflow-hidden">
                    <div className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/blog/default-blog-image.jpg';
                          }}
                        />
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-white/90 text-gray-700">
                            {post.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getReadingTimeText(post.reading_time)}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs text-gray-700 border-gray-300">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                          ))}
                        </div>
                        
                        <Link href={`/blog/${locale}/${post.slug}`}>
                          <Button variant="ghost" size="sm" className="group/btn text-gray-700 hover:text-indigo-600 hover:bg-gray-50">
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default BlogIndex;