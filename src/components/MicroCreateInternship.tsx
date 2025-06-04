import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyCQUIU_wCmUKECZnfEMaRgwc3zEyE4F-rQ');

const MicroCreateInternship = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [difficulty, setDifficulty] = useState('beginner');
  const [estimatedHours, setEstimatedHours] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [requirementInput, setRequirementInput] = useState('');
  const [xpReward, setXpReward] = useState(100);
  const [badgeName, setBadgeName] = useState('');
  const [badgeImageUrl, setBadgeImageUrl] = useState('https://cdn-icons-png.flaticon.com/512/1183/1183672.png');
  const [aiTechSpec, setAiTechSpec] = useState('');
  
  // Categories for form
  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Analysis',
    'Design',
    'Content Creation',
    'Marketing'
  ];
  
  // Badge images for selection
  const badgeImages = [
    { url: 'https://cdn-icons-png.flaticon.com/512/1183/1183672.png', name: 'React' },
    { url: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', name: 'Flutter' },
    { url: 'https://cdn-icons-png.flaticon.com/512/4581/4581853.png', name: 'Data' },
    { url: 'https://cdn-icons-png.flaticon.com/512/3159/3159310.png', name: 'Design' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2282/2282188.png', name: 'Content' },
    { url: 'https://cdn-icons-png.flaticon.com/512/6132/6132220.png', name: 'Python' }
  ];

  useEffect(() => {
    // Redirect if not logged in or not a business account
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (userData && userData.role !== 'business') {
      navigate('/micro-internships');
      return;
    }
  }, [user, userData, navigate]);

  // Add skill to skills list
  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  // Remove skill from skills list
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Add requirement to requirements list
  const handleAddRequirement = () => {
    if (requirementInput.trim() && !requirements.includes(requirementInput.trim())) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  // Remove requirement from requirements list
  const handleRemoveRequirement = (reqToRemove: string) => {
    setRequirements(requirements.filter(req => req !== reqToRemove));
  };

  // Generate technical specification using Gemini API
  const generateTechSpec = async () => {
    if (!title || !description || skills.length === 0) {
      alert('Для генерации технического задания необходимо указать название, описание и навыки.');
      return;
    }
    
    setAiLoading(true);
    setError(null);
    
    try {
      // Use Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Create prompt for AI
      const prompt = `
        Создай детальное техническое задание для микро-стажировки.
        
        Информация о проекте:
        - Название: ${title}
        - Описание: ${description}
        - Категория: ${category}
        - Сложность: ${difficulty === 'beginner' ? 'начальная' : difficulty === 'intermediate' ? 'средняя' : 'продвинутая'}
        - Необходимые навыки: ${skills.join(', ')}
        - Требования: ${requirements.join(', ')}
        - Примерное время на выполнение: ${estimatedHours} часов
        
        Техническое задание должно содержать:
        1. Обзор проекта
        2. Детальные требования и спецификации
        3. Ожидаемые результаты/deliverables
        4. Технические ограничения и рекомендации
        5. Timeline с разбивкой по этапам
        6. Ресурсы и ссылки для помощи
        
        Задание должно быть реалистичным для стажировки студента с учетом указанной сложности и времени.
        Сформатируй ответ в Markdown для лучшей читаемости.
      `;
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Set generated tech spec
      setAiTechSpec(text);
    } catch (error) {
      console.error('Error generating tech spec:', error);
      setError('Не удалось сгенерировать техническое задание. Пожалуйста, попробуйте снова или введите его вручную.');
    } finally {
      setAiLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title || !description || skills.length === 0 || !deadline || !badgeName) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create internship object
      const internshipData = {
        title,
        description,
        requirements,
        skills,
        employerId: user?.uid,
        employer: {
          id: user?.uid,
          name: userData?.displayName || userData?.name,
          company: userData?.company || 'Компания',
          photoURL: userData?.photoURL
        },
        xpReward,
        badgeId: Date.now().toString(),
        badgeName,
        badgeImageUrl,
        deadline: new Date(deadline),
        createdAt: serverTimestamp(),
        status: 'active',
        difficulty,
        estimatedHours,
        category,
        applicationsCount: 0,
        completionsCount: 0,
        aiTechSpec
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'microInternships'), internshipData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/micro-internships/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating micro-internship:', error);
      setError('Не удалось создать микро-стажировку. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-dark-lighter py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Создание новой микро-стажировки
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Заполните детали и опубликуйте возможность для стажировки
          </p>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-2xl mb-4">✓</div>
            <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
              Микро-стажировка успешно создана!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Перенаправляем вас на страницу вашей новой микро-стажировки...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Основная информация
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Название *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Создайте адаптивный лендинг на React"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Описание *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите задачу кратко, но информативно"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  required
                />
              </div>
              
              {/* Category and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Категория *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Уровень сложности *
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  >
                    <option value="beginner">Начальный</option>
                    <option value="intermediate">Средний</option>
                    <option value="advanced">Продвинутый</option>
                  </select>
                </div>
              </div>
              
              {/* Estimated Hours and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Оценка времени (часов) *
                  </label>
                  <input
                    type="number"
                    id="estimatedHours"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseInt(e.target.value))}
                    min="1"
                    max="40"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Дедлайн *
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                    required
                  />
                </div>
              </div>
              
              {/* Skills */}
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Требуемые навыки *
                </label>
                <div className="flex mt-1">
                  <input
                    type="text"
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Например: react"
                    className="block w-full rounded-l-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark"
                  >
                    Добавить
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)} 
                        className="ml-1.5 inline-flex text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Добавьте хотя бы один навык
                    </span>
                  )}
                </div>
              </div>
              
              {/* Requirements */}
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Требования
                </label>
                <div className="flex mt-1">
                  <input
                    type="text"
                    id="requirements"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    placeholder="Например: HTML/CSS"
                    className="block w-full rounded-l-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark"
                  >
                    Добавить
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {requirements.map((req, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {req}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveRequirement(req)} 
                        className="ml-1.5 inline-flex text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {requirements.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Требования необязательны, но помогут студентам лучше понять задачу
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Награды и бейдж
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* XP Reward */}
              <div>
                <label htmlFor="xpReward" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  XP награда *
                </label>
                <input
                  type="number"
                  id="xpReward"
                  value={xpReward}
                  onChange={(e) => setXpReward(parseInt(e.target.value))}
                  min="50"
                  max="500"
                  step="10"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Рекомендуемые награды: 50-100 XP для начального уровня, 100-200 XP для среднего, 200-500 XP для продвинутого
                </p>
              </div>
              
              {/* Badge */}
              <div>
                <label htmlFor="badgeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Название бейджа *
                </label>
                <input
                  type="text"
                  id="badgeName"
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="Например: React Developer I"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                  required
                />
              </div>
              
              {/* Badge Image Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Выберите изображение бейджа *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {badgeImages.map((badge, index) => (
                    <div 
                      key={index}
                      onClick={() => setBadgeImageUrl(badge.url)}
                      className={`cursor-pointer border-2 rounded-lg p-2 flex flex-col items-center ${
                        badgeImageUrl === badge.url 
                          ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/5' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <img 
                        src={badge.url} 
                        alt={badge.name} 
                        className="h-12 w-12" 
                      />
                      <span className="mt-1 text-xs text-center">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Техническое задание
              </h2>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={generateTechSpec}
                  disabled={aiLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Генерация...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Сгенерировать с помощью Gemini AI
                    </>
                  )}
                </button>
                
                {error && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
              
              <textarea
                value={aiTechSpec}
                onChange={(e) => setAiTechSpec(e.target.value)}
                placeholder="Опишите детальные требования к выполнению задания или воспользуйтесь генерацией с помощью AI..."
                rows={10}
                className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white font-mono text-sm"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Техническое задание можно отредактировать после генерации или создать вручную. 
                Поддерживается Markdown-форматирование.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-dark-light flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/micro-internships')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-lighter hover:bg-gray-50 dark:hover:bg-dark focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent mr-3"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Создание...
                  </>
                ) : 'Опубликовать микро-стажировку'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MicroCreateInternship; 