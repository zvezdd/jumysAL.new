import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';

const ResumeGenerator = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [industry, setIndustry] = useState('');
  const [resumeStyle, setResumeStyle] = useState('modern');
  
  useEffect(() => {
    // Загрузка данных пользователя при монтировании компонента
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        setError('Профиль пользователя не найден. Пожалуйста, заполните ваш профиль.');
      }
    } catch (err) {
      console.error('Ошибка при получении данных пользователя:', err);
      setError('Не удалось загрузить профиль пользователя. Попробуйте снова.');
    }
  };
  
  const handleGenerateResume = async () => {
    if (!user) {
      setError('Пожалуйста, войдите в систему, чтобы сгенерировать резюме');
      return;
    }

    if (!userData) {
      setError('Пожалуйста, заполните ваш профиль перед генерацией резюме');
      return;
    }

    if (!targetPosition) {
      setError('Пожалуйста, укажите целевую должность');
      return;
    }

    setGenerating(true);
    setError('');
    
    try {
      // Имитация времени обработки ИИ
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Создание шаблона резюме на основе данных пользователя и введенных полей
      const generatedResume = `
# Резюме ${userData.displayName || 'Профессионал'}
## ${targetPosition} - ${industry || 'Общее'}

### Контактная информация
Электронная почта: ${userData.email || ''}
${userData.phone ? `Телефон: ${userData.phone}` : ''}

### Профессиональная сводка
${userData.bio || 'Преданный профессионал с опытом и навыками в соответствующих областях.'}

### Навыки
${Array.isArray(userData.skills) ? userData.skills.join(', ') : (userData.skills || 'Различные профессиональные навыки')}

### Образование
${userData.education || 'Образовательный фон'}

### Опыт работы
${userData.experience || 'Профессиональный опыт'}

### Языки
${Array.isArray(userData.languages) ? userData.languages.join(', ') : (userData.languages || 'Владение языками')}

### Достижения
${userData.achievements || 'Значимые достижения и награды'}

### Проекты
${userData.portfolio || 'Портфолио личных и профессиональных проектов'}
      `;
      
      // Сохранение сгенерированного резюме в профиль пользователя в Firebase
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        resumes: userData.resumes 
          ? [...userData.resumes, { 
              id: Date.now().toString(),
              title: `Резюме для ${targetPosition}`,
              content: generatedResume,
              createdAt: new Date().toISOString(),
              style: resumeStyle
            }] 
          : [{ 
              id: Date.now().toString(),
              title: `Резюме для ${targetPosition}`,
              content: generatedResume,
              createdAt: new Date().toISOString(),
              style: resumeStyle
            }]
      });
      
      // Показ сообщения об успехе
      setSuccess(true);
      
      // Сброс формы
      setTargetPosition('');
      setIndustry('');
      
      // Сброс сообщения об успехе через 5 секунд
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Ошибка при генерации резюме:', err);
      setError('Произошла ошибка при генерации резюме. Попробуйте снова.');
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ИИ-генератор <span className="text-primary">резюме</span>
          </h1>
          <div className="w-20 h-1 bg-primary mx-auto rounded mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Создайте профессиональное, адаптированное резюме за секунды с помощью нашей передовой технологии ИИ
          </p>
        </div>
        
        {/* Основное содержимое */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Левая сторона - Описание функций */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Как это работает</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Наш ИИ-генератор резюме использует передовые технологии искусственного интеллекта для создания персонализированных, 
                профессиональных резюме, адаптированных под ваши навыки, опыт и целевые должности.
              </p>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">1</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Анализ профиля</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      Наш ИИ анализирует ваш профиль JumysAL, включая ваши навыки, образование, опыт 
                      и достижения, чтобы понять ваши квалификации.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">2</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Подбор вакансий</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      Система определяет наиболее подходящие навыки и опыт для ваших целевых должностей, 
                      гарантируя, что ваше резюме выделяет то, что ищут работодатели.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">3</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Создание резюме</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      ИИ генерирует профессионально оформленное резюме с убедительными описаниями вашего 
                      опыта и достижений, адаптированное, чтобы выделить вас среди других кандидатов.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">4</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Скачивание и редактирование</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      Просмотрите ваше сгенерированное резюме, внесите желаемые изменения и скачайте его в формате PDF, 
                      готовое для отправки потенциальным работодателям.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ключевые преимущества</h2>
              <ul className="space-y-4">
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Экономия времени:</strong> Создайте профессиональное резюме за минуты, а не часы
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Адаптированное содержание:</strong> Оптимизировано под ваши карьерные цели и целевые должности
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Профессиональное оформление:</strong> Чистый, современный дизайн, привлекающий внимание работодателей
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Совместимость с ATS:</strong> Разработано для прохождения систем отслеживания кандидатов
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Несколько форматов:</strong> Скачивайте в формате PDF, Word или обычном тексте
                  </span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Правая сторона - Интерфейс генератора */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8 h-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Сгенерируйте ваше резюме</h2>
            
            {user ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Целевая должность</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark dark:text-white"
                    placeholder="например, разработчик ПО, стажер по маркетингу"
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Отрасль</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark dark:text-white"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Выберите отрасль</option>
                    <option value="technology">Технологии</option>
                    <option value="finance">Финансы</option>
                    <option value="healthcare">Здравоохранение</option>
                    <option value="education">Образование</option>
                    <option value="retail">Розничная торговля</option>
                    <option value="manufacturing">Производство</option>
                    <option value="marketing">Маркетинг</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Стиль резюме</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 hover:border-primary cursor-pointer">
                      <input 
                        type="radio" 
                        name="resumeStyle" 
                        id="modern" 
                        className="sr-only" 
                        value="modern"
                        checked={resumeStyle === 'modern'}
                        onChange={() => setResumeStyle('modern')}
                      />
                      <label htmlFor="modern" className="cursor-pointer flex flex-col items-center">
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          <div className="w-full h-4 bg-primary/30 rounded-t"></div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Современный</span>
                      </label>
                    </div>
                    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 hover:border-primary cursor-pointer">
                      <input 
                        type="radio" 
                        name="resumeStyle" 
                        id="classic" 
                        className="sr-only" 
                        value="classic"
                        checked={resumeStyle === 'classic'}
                        onChange={() => setResumeStyle('classic')}
                      />
                      <label htmlFor="classic" className="cursor-pointer flex flex-col items-center">
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          <div className="w-12 h-4 bg-primary/30 rounded-t mx-auto"></div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Классический</span>
                      </label>
                    </div>
                    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 hover:border-primary cursor-pointer">
                      <input 
                        type="radio" 
                        name="resumeStyle" 
                        id="creative" 
                        className="sr-only" 
                        value="creative"
                        checked={resumeStyle === 'creative'}
                        onChange={() => setResumeStyle('creative')}
                      />
                      <label htmlFor="creative" className="cursor-pointer flex flex-col items-center">
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          <div className="w-1/3 h-full bg-primary/30 rounded-l"></div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Креативный</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  <button
                    onClick={handleGenerateResume}
                    disabled={generating}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg shadow transition-all duration-300 ${
                      generating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary-dark'
                    } text-white font-medium`}
                  >
                    {generating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Генерация...
                      </>
                    ) : 'Сгенерировать резюме'}
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">Резюме успешно сгенерировано! Теперь вы можете скачать его из вашего профиля.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-primary/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Требуется вход</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Пожалуйста, войдите в свой аккаунт JumysAL, чтобы получить доступ к ИИ-генератору резюме.
                </p>
                <a 
                  href="/login" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                >
                  Войти
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Раздел отзывов */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Истории успеха</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Посмотрите, как наш ИИ-генератор резюме помог студентам получить работу мечты
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Айдар К.",
                position: "Стажер по разработке ПО",
                company: "Tech Innovations",
                image: "/assets/testimonials/aidar.jpg",
                quote: "ИИ-генератор резюме идеально выделил мои проекты по программированию. Я получил три приглашения на собеседование в течение недели после подачи резюме!"
              },
              {
                name: "Медина Т.",
                position: "Ассистент по маркетингу",
                company: "Global Media Group",
                image: "/assets/testimonials/madina.jpg",
                quote: "Как студентке с ограниченным опытом работы, мне было сложно создать впечатляющее резюме. ИИ-инструмент помог профессионально представить мои навыки и академические достижения."
              },
              {
                name: "Нурлан С.",
                position: "Стажер по финансам",
                company: "Национальный банк",
                image: "/assets/testimonials/nurlan.jpg",
                quote: "Функция адаптации резюме потрясающая! Она автоматически подчеркнула мои финансовые навыки и курсовые работы, что определенно помогло мне получить стажировку."
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Резервное изображение, если основное не загрузилось
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=0D8ABC&color=fff`;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{testimonial.name}</h3>
                    <p className="text-sm text-primary">{testimonial.position} в {testimonial.company}</p>
                  </div>
                </div>
                <div className="relative">
                  <svg className="w-8 h-8 text-primary/20 absolute -top-4 -left-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-300 italic pt-2">{testimonial.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Раздел часто задаваемых вопросов */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Часто задаваемые вопросы</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded"></div>
          </div>
          
          <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8 divide-y divide-gray-200 dark:divide-gray-700">
            {[
              {
                question: "ИИ-генератор резюме бесплатный?",
                answer: "Да, ИИ-генератор резюме полностью бесплатен для всех зарегистрированных пользователей JumysAL. Мы стремимся предоставлять ценные инструменты, чтобы помочь студентам добиться успеха в поиске работы."
              },
              {
                question: "Можно ли редактировать резюме после его генерации?",
                answer: "Конечно! Хотя наш ИИ создает прочную основу, вы можете редактировать любую часть сгенерированного резюме, чтобы добавить личные штрихи или дополнительную информацию."
              },
              {
                question: "Как ИИ знает, что включить в мое резюме?",
                answer: "ИИ анализирует информацию из вашего профиля JumysAL, включая образование, навыки, проекты и опыт работы, который вы добавили. Затем он использует эти данные для создания релевантного содержания для вашего резюме."
              },
              {
                question: "Будет ли мое резюме совместимым с ATS?",
                answer: "Да, все резюме, сгенерированные нашим ИИ, разработаны для совместимости с системами отслеживания кандидатов (ATS), используя подходящее форматирование и ключевые слова, чтобы помочь вам пройти автоматический отбор."
              },
              {
                question: "В каких форматах я могу скачать свое резюме?",
                answer: "Вы можете скачать резюме в формате PDF, Word (.docx) или обычном тексте, что дает вам гибкость в зависимости от требований подачи заявки."
              }
            ].map((faq, index) => (
              <div key={index} className="py-6 first:pt-0 last:pb-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeGenerator;