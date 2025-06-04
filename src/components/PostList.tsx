import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, query, where, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import FilterPanel, { Filters } from './FilterPanel';
import { addPoints } from '../utils/points';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  title: string;
  description: string;
  authorId: string;
  city?: string;
  category?: string;
  format?: string;
  salary?: string;
  experience?: string;
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  createdAt?: any;
}

interface UserData {
  displayName: string;
  role: string;
  resumeData?: {
    education: string;
    skills: string;
    experience: string;
    achievements: string;
    languages: string[];
    portfolio: string;
  };
}

const PostList: React.FC = () => {
  const [user] = useAuthState(auth);
  const { userData } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<Partial<Post>>({
    title: '',
    description: '',
    city: '',
    category: '',
    format: '',
    salary: '',
    experience: '',
    skills: [],
    requirements: [],
    benefits: []
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    city: '',
    category: '',
    format: '',
    search: '',
    experience: '',
    salary: ''
  });
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Предопределенные опции для выбора
  const cityOptions = ['Алматы', 'Астана', 'Шымкент', 'Другой'];
  const categoryOptions = ['IT', 'Маркетинг', 'Дизайн', 'Финансы', 'Образование', 'Другое'];
  const formatOptions = ['Офис', 'Онлайн', 'Гибрид'];
  const experienceOptions = ['Без опыта', '1-3 года', '3-5 лет', '5+ лет'];

  // Загрузка сохраненных постов
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const savedPostsQuery = query(
          collection(db, 'savedPosts'),
          where('userId', '==', user.uid)
        );
        
        const savedPostsSnapshot = await getDocs(savedPostsQuery);
        const savedIds = savedPostsSnapshot.docs.map(doc => doc.data().postId);
        setSavedPostIds(savedIds);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSavedPosts();
  }, [user]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Start with the base collection reference
        const postsRef = collection(db, 'posts');
        
        // Build the query by adding filters one by one
        let postsQuery = query(postsRef);
        
        // Apply filters if they exist
        if (filters.city) {
          postsQuery = query(postsQuery, where('city', '==', filters.city));
        }
        if (filters.category) {
          postsQuery = query(postsQuery, where('category', '==', filters.category));
        }
        if (filters.format) {
          postsQuery = query(postsQuery, where('format', '==', filters.format));
        }
        
        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Post));
        
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    
    fetchPosts();
  }, [filters.city, filters.category, filters.format]);

  // Фильтруем посты по поисковому запросу на клиенте
  useEffect(() => {
    if (!filters.search) {
      setFilteredPosts(posts);
      return;
    }
    
    const searchTerm = filters.search.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) || 
      post.description.toLowerCase().includes(searchTerm)
    );
    
    setFilteredPosts(filtered);
  }, [posts, filters.search]);

  const handleInputChange = (field: keyof Post, value: any) => {
    setNewPost(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'skills' | 'requirements' | 'benefits', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setNewPost(prev => ({ ...prev, [field]: items }));
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.title || !newPost.description) return;
    
    try {
      const postData = {
        ...newPost,
        authorId: user.uid,
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'posts'), postData);
      const newPostWithId = { id: docRef.id, ...postData };
      
      setPosts([newPostWithId as Post, ...posts]);
      setNewPost({
        title: '',
        description: '',
        city: '',
        category: '',
        format: '',
        salary: '',
        experience: '',
        skills: [],
        requirements: [],
        benefits: []
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleApply = async (post: Post) => {
    if (!user) return;
    
    try {
      // Fetch user data including resume
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data() as UserData;
      
      // Create initial message with resume data
      const resumeMessage = `
🎓 Application from ${userData.displayName}

${userData.resumeData?.education ? `📚 Education:
${userData.resumeData.education}` : ''}

${userData.resumeData?.skills ? `💪 Skills:
${userData.resumeData.skills}` : ''}

${userData.resumeData?.experience ? `💼 Experience:
${userData.resumeData.experience}` : ''}

${userData.resumeData?.achievements ? `🏆 Achievements:
${userData.resumeData.achievements}` : ''}

${userData.resumeData?.languages?.length ? `🌐 Languages:
${userData.resumeData.languages.join(', ')}` : ''}

${userData.resumeData?.portfolio ? `🔗 Portfolio:
${userData.resumeData.portfolio}` : ''}
      `;

      // Create chat with initial message and status
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, post.authorId],
        postId: post.id,
        createdAt: new Date(),
        lastMessage: resumeMessage,
        postTitle: post.title,
        status: 'pending',
        unreadCount: {
          [post.authorId]: 1
        },
        // Add notification for business owner
        notifications: {
          [post.authorId]: {
            type: 'new_application',
            read: false,
            timestamp: new Date()
          }
        }
      });

      // Add the initial message to the chat
      await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
        text: resumeMessage,
        senderId: user.uid,
        timestamp: new Date(),
        type: 'application'
      });

      // Create a notification for the business owner
      await addDoc(collection(db, 'notifications'), {
        userId: post.authorId,
        type: 'new_application',
        chatId: chatRef.id,
        postId: post.id,
        postTitle: post.title,
        applicantName: userData.displayName,
        read: false,
        timestamp: new Date()
      });

      // Show success message
      alert('Your application has been sent successfully!');
      
      // Navigate to the chat
      window.location.href = `/chat/${chatRef.id}`;
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('There was an error sending your application. Please try again.');
    }
  };

  const toggleSavePost = async (postId: string) => {
    if (!user) return;
    
    try {
      const savedPostRef = doc(db, 'savedPosts', `${user.uid}_${postId}`);
      const isSaved = savedPostIds.includes(postId);
      
      if (isSaved) {
        // Удаляем из сохраненных
        await deleteDoc(savedPostRef);
        setSavedPostIds(savedPostIds.filter(id => id !== postId));
      } else {
        // Добавляем в сохраненные
        await setDoc(savedPostRef, {
          userId: user.uid,
          postId,
          savedAt: new Date()
        });
        setSavedPostIds([...savedPostIds, postId]);
        
        // Начисляем баллы за сохранение поста
        const result = await addPoints(user.uid, 'save_post');
        if (result.success) {
          // Показываем уведомление о начислении баллов
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-up';
          notification.textContent = `+${result.points} баллов за сохранение поста!`;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      }
    } catch (error) {
      console.error('Error toggling saved post:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center text-orange-400 mb-8">Объявления</h2>
        
        {user && userData && userData.role === 'business' && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showCreateForm ? 'Отменить' : 'Создать вакансию'}
            </button>

            {showCreateForm && (
              <div className="mt-4 bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Создать новую вакансию</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Название вакансии
                    </label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="Frontend Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={newPost.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white h-32"
                      placeholder="Подробное описание вакансии..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Город
                      </label>
                      <select
                        value={newPost.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Выберите город</option>
                        {cityOptions.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Категория
                      </label>
                      <select
                        value={newPost.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Выберите категорию</option>
                        {categoryOptions.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Формат работы
                      </label>
                      <select
                        value={newPost.format}
                        onChange={(e) => handleInputChange('format', e.target.value)}
                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Выберите формат</option>
                        {formatOptions.map(format => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Опыт работы
                      </label>
                      <select
                        value={newPost.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Выберите требуемый опыт</option>
                        {experienceOptions.map(exp => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Зарплата
                    </label>
                    <input
                      type="text"
                      value={newPost.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="например: 400 000 - 600 000 тг"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Требуемые навыки (через запятую)
                    </label>
                    <input
                      type="text"
                      value={newPost.skills?.join(', ')}
                      onChange={(e) => handleArrayInput('skills', e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="React, TypeScript, Node.js"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Требования (через запятую)
                    </label>
                    <input
                      type="text"
                      value={newPost.requirements?.join(', ')}
                      onChange={(e) => handleArrayInput('requirements', e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="Высшее образование, Знание английского языка"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Преимущества (через запятую)
                    </label>
                    <input
                      type="text"
                      value={newPost.benefits?.join(', ')}
                      onChange={(e) => handleArrayInput('benefits', e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="Гибкий график, ДМС, Бонусы"
                    />
                  </div>

                  <button
                    onClick={handleCreatePost}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Опубликовать вакансию
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Панель фильтров */}
        <FilterPanel 
          filters={filters} 
          setFilters={setFilters} 
          resultCount={filteredPosts.length} 
        />
        
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 border border-gray-800 text-center">
              <p className="text-gray-300">По вашему запросу ничего не найдено. Попробуйте изменить фильтры.</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 border border-gray-800">
                <div className="flex justify-between items-start">
                  <h4 className="text-xl font-bold text-orange-400 mb-3">{post.title}</h4>
                  {user && user.uid !== post.authorId && (
                    <button
                      onClick={() => toggleSavePost(post.id)}
                      className={`text-2xl transition-transform hover:scale-110 ${savedPostIds.includes(post.id) ? 'text-red-500' : 'text-gray-400'}`}
                      title={savedPostIds.includes(post.id) ? "Удалить из сохраненных" : "Сохранить вакансию"}
                    >
                      {savedPostIds.includes(post.id) ? '❤️' : '🤍'}
                    </button>
                  )}
                </div>
                <p className="text-gray-300 mb-4">{post.description}</p>
                
                {/* Отображение метаданных вакансии */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.city && (
                    <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                      📍 {post.city}
                    </span>
                  )}
                  {post.category && (
                    <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                      🧠 {post.category}
                    </span>
                  )}
                  {post.format && (
                    <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                      🌐 {post.format}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  {user && user.uid !== post.authorId && (
                    <button 
                      onClick={() => handleApply(post)} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      Откликнуться
                    </button>
                  )}
                  <a 
                    href={`/post/${post.id}`} 
                    className="text-blue-400 hover:text-blue-300 transition duration-300"
                  >
                    Подробнее
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostList;
