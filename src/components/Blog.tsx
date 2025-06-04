import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

// Типы данных для блога
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  imageUrl: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    photoUrl: string;
  };
  createdAt: {
    toDate: () => Date;
  };
  updatedAt: {
    toDate: () => Date;
  };
  publishedAt: {
    toDate: () => Date;
  };
  views: number;
  likes: number;
  commentsCount: number;
  isFeatured: boolean;
  readTime: number;
}

// Категории блога
const CATEGORIES = [
  'Резюме и письма',
  'Карьера и стажировки',
  'Советы работодателям',
  'Технологии и навыки',
  'Эффективность и тайм-менеджмент',
  'Кейсы и истории успеха'
];

// Демо-данные для блога
const DEMO_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Как школьнику написать первое резюме и не облажаться',
    slug: 'how-to-create-perfect-resume',
    description: 'Шаг-за-шагом разберём идеальную структуру, расскажем, какие ключевые слова добавить и как оформить шаблон, чтобы HR сразу заметил ваш профиль.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070',
    category: 'Резюме и письма',
    tags: ['резюме', 'школьники', 'шаблоны', 'HR'],
    author: {
      id: 'author1',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/women/42.jpg'
    },
    createdAt: { toDate: () => new Date('2023-05-12') },
    updatedAt: { toDate: () => new Date('2023-05-12') },
    publishedAt: { toDate: () => new Date('2023-05-12') },
    views: 125,
    likes: 18,
    commentsCount: 3,
    isFeatured: true,
    readTime: 5
  },
  {
    id: '2',
    title: '5 fatal-ошибок в сопроводительном письме и как их исправить',
    slug: 'cover-letter-mistakes',
    description: 'Разбираем типичные ошибки в сопроводительных письмах, которые отпугивают HR-специалистов, и как их избежать.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?q=80&w=2070',
    category: 'Резюме и письма',
    tags: ['сопроводительное письмо', 'ошибки', 'советы'],
    author: {
      id: 'author2',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    createdAt: { toDate: () => new Date('2023-05-05') },
    updatedAt: { toDate: () => new Date('2023-05-05') },
    publishedAt: { toDate: () => new Date('2023-05-05') },
    views: 98,
    likes: 14,
    commentsCount: 2,
    isFeatured: false,
    readTime: 4
  },
  {
    id: '3',
    title: 'AI-генератор резюме: настройки для школьников',
    slug: 'top-interview-questions',
    description: 'Как использовать искусственный интеллект для создания профессионального резюме, даже если у вас минимальный опыт.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1679403766669-957cc2fafef8?q=80&w=2070',
    category: 'Резюме и письма',
    tags: ['AI', 'резюме', 'генератор', 'школьники'],
    author: {
      id: 'author3',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/women/64.jpg'
    },
    createdAt: { toDate: () => new Date('2023-04-28') },
    updatedAt: { toDate: () => new Date('2023-04-28') },
    publishedAt: { toDate: () => new Date('2023-04-28') },
    views: 76,
    likes: 11,
    commentsCount: 1,
    isFeatured: false,
    readTime: 3
  },
  {
    id: '4',
    title: 'Где искать первую стажировку: обзор 7 платформ в Казахстане',
    slug: 'internship-platforms-kazakhstan',
    description: 'Подробный обзор лучших платформ и ресурсов для поиска стажировок в Казахстане, идеально подходящих для школьников.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?q=80&w=2069',
    category: 'Карьера и стажировки',
    tags: ['стажировка', 'поиск работы', 'платформы', 'Казахстан'],
    author: {
      id: 'author4',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/men/45.jpg'
    },
    createdAt: { toDate: () => new Date('2023-05-10') },
    updatedAt: { toDate: () => new Date('2023-05-10') },
    publishedAt: { toDate: () => new Date('2023-05-10') },
    views: 110,
    likes: 19,
    commentsCount: 4,
    isFeatured: false,
    readTime: 7
  },
  {
    id: '5',
    title: 'Первое техническое собеседование: шпаргалка для школьника-айтишника',
    slug: 'tech-interview-tips',
    description: 'Пошаговый гайд, который поможет подростку подготовиться к первому «тех-интервью»: от создания Git-портфолио до типовых вопросов и лайф-хаков по общению с HR-ами.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2070',
    category: 'Карьера и стажировки',
    tags: ['собеседование', 'школьники', 'айти', 'карьера'],
    author: {
      id: 'author1',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/women/42.jpg'
    },
    createdAt: { toDate: () => new Date('2023-05-30') },
    updatedAt: { toDate: () => new Date('2023-05-30') },
    publishedAt: { toDate: () => new Date('2023-05-30') },
    views: 88,
    likes: 15,
    commentsCount: 2,
    isFeatured: false,
    readTime: 6
  },
  {
    id: '6',
    title: 'Как устроить стажёрскую программу для школьников',
    slug: 'networking-tips',
    description: 'Полное руководство для работодателей по организации эффективной стажёрской программы для школьников.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070',
    category: 'Советы работодателям',
    tags: ['стажировка', 'программа', 'работодатели', 'организация'],
    author: {
      id: 'author5',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/women/29.jpg'
    },
    createdAt: { toDate: () => new Date('2023-05-08') },
    updatedAt: { toDate: () => new Date('2023-05-08') },
    publishedAt: { toDate: () => new Date('2023-05-08') },
    views: 67,
    likes: 9,
    commentsCount: 2,
    isFeatured: false,
    readTime: 6
  },
  {
    id: '7',
    title: 'Метод Pomodoro для учеников: успеть всё и не сгореть',
    slug: 'pomodoro-technique-for-students',
    description: 'Как использовать технику Pomodoro для эффективного управления временем и повышения продуктивности в учебе.',
    content: '<p>Полный контент статьи...</p>',
    imageUrl: 'https://images.unsplash.com/photo-1534859108275-a3a6f52743c0?q=80&w=1974',
    category: 'Эффективность и тайм-менеджмент',
    tags: ['тайм-менеджмент', 'pomodoro', 'продуктивность', 'учеба'],
    author: {
      id: 'author6',
      name: 'Талгатов Даниял',
      photoUrl: 'https://randomuser.me/api/portraits/women/78.jpg'
    },
    createdAt: { toDate: () => new Date('2023-05-06') },
    updatedAt: { toDate: () => new Date('2023-05-06') },
    publishedAt: { toDate: () => new Date('2023-05-06') },
    views: 89,
    likes: 12,
    commentsCount: 3,
    isFeatured: false,
    readTime: 8
  }
];

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if collection exists
        const collectionRef = collection(db, 'blog_posts');
        
        // Try to get blog posts
        try {
          const postsQuery = query(
            collectionRef,
            orderBy('publishedAt', 'desc')
          );
          
          const postDocs = await getDocs(postsQuery);
          
          if (postDocs.empty) {
            console.log('No documents found in blog_posts collection. Using demo data.');
            setPosts(DEMO_POSTS);
            
            // Featured post
            const featuredPost = DEMO_POSTS.find(post => post.isFeatured);
            setFeaturedPost(featuredPost || DEMO_POSTS[0]);
            
            // Popular posts (sort by views)
            const popularPosts = [...DEMO_POSTS]
              .sort((a, b) => b.views - a.views)
              .slice(0, 5);
            setPopularPosts(popularPosts);
            
            // Tags
            const allTags = DEMO_POSTS.reduce((acc: string[], post) => {
              return [...acc, ...post.tags];
            }, []);
            
            const tagsCount = allTags.reduce((acc: {[key: string]: number}, tag) => {
              acc[tag] = (acc[tag] || 0) + 1;
              return acc;
            }, {});
            
            setTags(Object.keys(tagsCount).sort((a, b) => tagsCount[b] - tagsCount[a]).slice(0, 20));
          } else {
            // We have real data, process it
            const postsData = postDocs.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title,
                slug: data.slug,
                description: data.description || '',
                content: data.content || '',
                imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070',
                category: data.category || 'Резюме и письма',
                tags: data.tags || [],
                author: data.author || {
                  id: 'default',
                  name: 'Талгатов Даниял',
                  photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
                },
                createdAt: data.createdAt || { toDate: () => new Date() },
                updatedAt: data.updatedAt || { toDate: () => new Date() },
                publishedAt: data.publishedAt || data.createdAt || { toDate: () => new Date() },
                views: data.views || 0,
                likes: data.likes || 0,
                commentsCount: data.commentsCount || 0,
                isFeatured: data.isFeatured || false,
                readTime: data.readTime || 5
              } as BlogPost;
            });
            
            setPosts(postsData);
            
            // Featured post
            const featuredPost = postsData.find(post => post.isFeatured);
            setFeaturedPost(featuredPost || postsData[0]);
            
            // Popular posts
            const popularPosts = [...postsData]
              .sort((a, b) => b.views - a.views)
              .slice(0, 5);
            setPopularPosts(popularPosts);
            
            // Tags
            const allTags = postsData.reduce((acc: string[], post) => {
              return [...acc, ...post.tags];
            }, []);
            
            const tagsCount = allTags.reduce((acc: {[key: string]: number}, tag) => {
              acc[tag] = (acc[tag] || 0) + 1;
              return acc;
            }, {});
            
            setTags(Object.keys(tagsCount).sort((a, b) => tagsCount[b] - tagsCount[a]).slice(0, 20));
          }
        } catch (error) {
          console.error('Error fetching blog posts:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in fetchPosts:', error);
        setError('Не удалось загрузить статьи блога. Используем демо-данные.');
        
        // Use demo data on error
        setPosts(DEMO_POSTS);
        
        const featuredPost = DEMO_POSTS.find(post => post.isFeatured);
        setFeaturedPost(featuredPost || DEMO_POSTS[0]);
        
        const popularPosts = [...DEMO_POSTS]
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);
        setPopularPosts(popularPosts);
        
        const allTags = DEMO_POSTS.reduce((acc: string[], post) => {
          return [...acc, ...post.tags];
        }, []);
        
        const tagsCount = allTags.reduce((acc: {[key: string]: number}, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});
        
        setTags(Object.keys(tagsCount).sort((a, b) => tagsCount[b] - tagsCount[a]).slice(0, 20));
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Фильтрация постов по категории и поисковому запросу
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory ? post.category === selectedCategory : true;
    const matchesSearch = searchTerm 
      ? post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        post.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesCategory && matchesSearch;
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Пожалуйста, введите корректный email адрес');
      return;
    }
    
    // Here you would normally save the email to your database
    // For demo purposes, just show an alert
    alert(`Спасибо! Вы успешно подписались на рассылку блога JumysAL с адресом: ${email}`);
    setEmail('');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Загрузка статей...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-dark-lighter py-12 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Блог <span className="text-primary dark:text-accent">JumysAL</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Практические уроки и советы для школьников и работодателей
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск по статьям..."
                  className="block w-full pl-10 py-3 bg-gray-50 dark:bg-dark border border-gray-300 dark:border-dark-border rounded-lg focus:ring-primary focus:border-primary dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12 bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 md:w-1/2">
                <img 
                  className="h-64 w-full object-cover md:h-full" 
                  src={featuredPost.imageUrl} 
                  alt={featuredPost.title} 
                />
              </div>
              <div className="p-8 md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="uppercase tracking-wide text-sm text-primary dark:text-accent font-semibold">
                    {featuredPost.category}
                  </div>
                  <Link 
                    to={`/blog/${featuredPost.slug}`} 
                    className="block mt-2 text-2xl font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-accent"
                  >
                    {featuredPost.title}
                  </Link>
                  <p className="mt-3 text-gray-600 dark:text-gray-300">
                    {featuredPost.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-10 w-10 rounded-full" 
                      src={featuredPost.author.photoUrl} 
                      alt={featuredPost.author.name} 
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {featuredPost.author.name}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
                      <span>{formatDate(featuredPost.publishedAt.toDate())}</span>
                      <span>•</span>
                      <span>{featuredPost.readTime} мин чтения</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                selectedCategory === null 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark'
              }`}
            >
              Все
            </button>
            {CATEGORIES.map((category, index) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                  index === CATEGORIES.length - 1 ? 'rounded-r-md' : ''
                } ${
                  selectedCategory === category 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {selectedCategory || 'Все статьи'}
            </h2>
            
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-6 text-center">
                <p className="text-gray-600 dark:text-gray-300">По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden">
                    <Link to={`/blog/${post.slug}`}>
                      <img 
                        className="h-48 w-full object-cover" 
                        src={post.imageUrl} 
                        alt={post.title} 
                      />
                    </Link>
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <span className="bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent px-2 py-1 rounded text-xs">
                          {post.category}
                        </span>
                        <span className="mx-2">&middot;</span>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatDate(post.publishedAt.toDate())}</span>
                          <span>•</span>
                          <span>{post.readTime} мин чтения</span>
                        </div>
                      </div>
                      <Link 
                        to={`/blog/${post.slug}`} 
                        className="block mt-2 text-xl font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-accent"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                        {post.description}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            className="h-8 w-8 rounded-full" 
                            src={post.author.photoUrl} 
                            alt={post.author.name} 
                          />
                          <p className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                            {post.author.name}
                          </p>
                        </div>
                        <div className="flex space-x-4 text-gray-500 dark:text-gray-400">
                          <span className="flex items-center text-sm">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.views}
                          </span>
                          <span className="flex items-center text-sm">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.likes}
                          </span>
                          <span className="flex items-center text-sm">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            {post.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {filteredPosts.length > 0 && (
              <div className="mt-8 text-center">
                <button className="bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark text-white font-medium py-2 px-6 rounded-lg">
                  Загрузить ещё
                </button>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-8">
            {/* Popular Posts */}
            <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Популярные статьи
              </h3>
              <div className="space-y-4">
                {popularPosts.map(post => (
                  <Link 
                    key={post.id} 
                    to={`/blog/${post.slug}`}
                    className="flex items-center gap-4 group"
                  >
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-accent">
                        {post.title}
                      </h4>
                      <div className="text-sm text-gray-500">
                        {formatDate(post.publishedAt.toDate())}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Tags Cloud */}
            <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Теги
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button 
                    key={tag} 
                    className="px-3 py-1 bg-gray-100 dark:bg-dark text-gray-800 dark:text-gray-300 rounded-full text-sm hover:bg-primary hover:text-white dark:hover:bg-accent"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="bg-primary/5 dark:bg-accent/5 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Подписка на новости
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Получайте лучшие статьи месяца на ваш email
              </p>
              <form onSubmit={handleSubscribe}>
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ваш email..."
                    className="flex-grow border border-gray-300 dark:border-dark-border rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent dark:bg-dark dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-primary dark:bg-accent text-white font-medium py-2 px-4 rounded-r-lg"
                  >
                    Подписаться
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog; 