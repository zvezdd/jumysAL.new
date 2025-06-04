import React, { useState } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { triggerCandidateMatching } from '../api/aiRecruit';

interface PostFormData {
  title: string;
  description: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  format: string;
  experienceLevel: string;
  salary: string;
  skills: string[];
  requirements: string[];
  benefits: string[];
  // AI Matching fields
  aiMatching: boolean;
  skillsRequired: string[];
  minExperience: number;
  otherCriteria: string;
}

const CreatePost: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postData, setPostData] = useState<PostFormData>({
    title: '',
    description: '',
    companyName: '',
    companyLogo: '',
    location: '',
    employmentType: '',
    format: '',
    experienceLevel: '',
    salary: '',
    skills: [],
    requirements: [],
    benefits: [],
    // Initialize AI Matching fields
    aiMatching: false,
    skillsRequired: [],
    minExperience: 0,
    otherCriteria: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [lastCreatedPostId, setLastCreatedPostId] = useState<string>('');

  // Предопределенные опции для выбора
  const locationOptions = ['Алматы', 'Астана', 'Шымкент', 'Другой'];
  const employmentTypeOptions = ['Полная занятость', 'Частичная занятость', 'Проектная работа', 'Стажировка'];
  const formatOptions = ['Офис', 'Удаленно', 'Гибрид'];
  const experienceLevelOptions = ['Без опыта', 'Начальный уровень', 'Средний уровень', 'Продвинутый уровень'];
  
  // Universities in Kazakhstan
  const universityOptions = [
    'КазНУ им. аль-Фараби',
    'ЕНУ им. Л.Н. Гумилева',
    'КБТУ',
    'КИМЭП',
    'Назарбаев Университет',
    'AIU',
    'Satbayev University',
    'МУИТ',
    'SDU',
    'Другой'
  ];

  const handleInputChange = (field: keyof PostFormData, value: string | number | boolean) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'skills' | 'requirements' | 'benefits' | 'skillsRequired', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setPostData(prev => ({ ...prev, [field]: items }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get user data to verify role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setError('User profile not found');
        return;
      }

      const userData = userDoc.data();
      if (!userData.role || !['employer', 'business'].includes(userData.role)) {
        setError('Only employers can create job posts');
        return;
      }

      // Validate required fields
      if (!postData.title || !postData.description || !postData.companyName || 
          !postData.location || !postData.employmentType || !postData.format || 
          !postData.experienceLevel || !postData.salary) {
        setError('Please fill in all required fields');
        return;
      }

      // Create post object
      const newPostData = {
        ...postData,
        authorId: user.uid,
        createdAt: new Date(),
        postedDate: new Date(),
        status: 'active',
        type: 'job',
        // Add company info from user profile
        companyName: userData.companyName || postData.companyName,
        companyLogo: userData.companyLogo || postData.companyLogo,
        // Add AI matching data if enabled
        aiMatching: postData.aiMatching,
        aiMatchingData: postData.aiMatching ? {
          skillsRequired: postData.skillsRequired,
          minExperience: postData.minExperience,
          otherCriteria: postData.otherCriteria
        } : null
      };

      console.log("Создаем новую вакансию с данными:", {
        title: newPostData.title,
        type: newPostData.type,
        authorId: newPostData.authorId,
        createdAt: newPostData.createdAt
      });

      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), newPostData);

      setLastCreatedPostId(docRef.id);
      console.log("Вакансия успешно создана с ID:", docRef.id, "Тип документа:", newPostData.type);

      // Trigger AI matching if enabled
      if (postData.aiMatching) {
        await triggerCandidateMatching(docRef.id);
      }

      // Show success message
      setSuccess(true);
      setError(null);
      
      // Show success message with ID
      console.log("Post created successfully with ID:", docRef.id);

      // Reset form
      setPostData({
        title: '',
        description: '',
        companyName: '',
        companyLogo: '',
        location: '',
        employmentType: '',
        format: '',
        experienceLevel: '',
        salary: '',
        skills: [],
        requirements: [],
        benefits: [],
        aiMatching: false,
        skillsRequired: [],
        minExperience: 0,
        otherCriteria: ''
      });

      // Navigate to jobs page after delay (увеличим задержку для лучшего UX)
      setTimeout(() => {
        navigate('/jobs');
      }, 5000); // Увеличим до 5 секунд, чтобы пользователь успел прочитать сообщение

    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred while creating the post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-orange-400 mb-4">Доступ ограничен</h2>
          <p className="text-gray-300 mb-6">Для создания вакансии необходимо авторизоваться.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-300"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12 pt-32">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center text-blue-400 mb-8">Создание вакансии</h2>
        <p className="text-lg text-center text-gray-300 mb-12">Помогите школьникам сделать первые карьерные шаги</p>

        {success && (
          <div className="mb-6 bg-green-900/50 text-white p-4 rounded-lg">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Вакансия успешно создана! Вы будете перенаправлены на страницу вакансий через несколько секунд.
            </p>
            <p className="mt-2 pl-7 text-sm text-green-300">
              ID вакансии: <span className="font-mono">{lastCreatedPostId}</span>
            </p>
            <div className="mt-4 pl-7">
              <button 
                onClick={() => navigate('/jobs')} 
                className="text-sm bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                Перейти сейчас
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/50 text-white p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Название вакансии*
              </label>
              <input
                type="text"
                value={postData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Frontend Developer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Название компании*
              </label>
              <input
                type="text"
                value={postData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="JumysAL"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ссылка на логотип компании
              </label>
              <input
                type="text"
                value={postData.companyLogo || ''}
                onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Описание*
              </label>
              <textarea
                value={postData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Подробное описание вакансии..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Местоположение*
                </label>
                <select
                  value={postData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Выберите город</option>
                  {locationOptions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Тип занятости*
                </label>
                <select
                  value={postData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Выберите тип занятости</option>
                  <option value="Полная занятость">Полная занятость</option>
                  <option value="Частичная занятость">Частичная занятость</option>
                  <option value="Стажировка">Стажировка</option>
                  <option value="Проектная работа">Проектная работа</option>
                  <option value="Волонтерство">Волонтерство</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Формат работы*
                </label>
                <select
                  value={postData.format || ''}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Выберите формат</option>
                  <option value="Офис">Офис</option>
                  <option value="Удаленно">Удаленно</option>
                  <option value="Гибрид">Гибрид</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Уровень опыта
                </label>
                <select
                  value={postData.experienceLevel || ''}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите уровень</option>
                  <option value="Без опыта">Без опыта</option>
                  <option value="Начальный уровень">Начальный уровень</option>
                  <option value="1-3 года">1-3 года</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Зарплата
              </label>
              <input
                type="text"
                value={postData.salary || ''}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20 000 - 80 000 ₸"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Требуемые навыки (через запятую)
              </label>
              <input
                type="text"
                value={postData.skills?.join(', ') || ''}
                onChange={(e) => handleArrayInput('skills', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="React, TypeScript, CSS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Требования (через запятую)
              </label>
              <input
                type="text"
                value={postData.requirements?.join(', ') || ''}
                onChange={(e) => handleArrayInput('requirements', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ответственность, Пунктуальность, Знание английского"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Преимущества (через запятую)
              </label>
              <input
                type="text"
                value={postData.benefits?.join(', ') || ''}
                onChange={(e) => handleArrayInput('benefits', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Гибкий график, Наставник, Сертификат"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="forSchoolStudents"
                checked={postData.aiMatching || false}
                onChange={(e) => handleInputChange('aiMatching', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="forSchoolStudents" className="ml-2 text-sm font-medium text-blue-300">
                Включить AI-подбор кандидатов 🤖
              </label>
            </div>

            {postData.aiMatching && (
              <div className="bg-blue-900/20 p-5 rounded-lg space-y-4 mt-4 border border-blue-800/30">
                <p className="text-blue-300 text-sm">
                  AI автоматически подберет наиболее подходящих кандидатов по указанным критериям
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Обязательные навыки (через запятую)
                  </label>
                  <input
                    type="text"
                    value={postData.skillsRequired.join(', ')}
                    onChange={(e) => handleArrayInput('skillsRequired', e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="React, Redux, TypeScript"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Минимальный уровень знаний
                  </label>
                  <select
                    value={postData.minExperience}
                    onChange={(e) => handleInputChange('minExperience', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Начинающий</option>
                    <option value={1}>Средний</option>
                    <option value={2}>Продвинутый</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Дополнительные критерии
                  </label>
                  <textarea
                    value={postData.otherCriteria}
                    onChange={(e) => handleInputChange('otherCriteria', e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Укажите любые дополнительные требования или предпочтения для AI-подбора"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Публикация...' : 'Опубликовать вакансию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost; 