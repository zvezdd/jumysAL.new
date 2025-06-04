import React, { useEffect, useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProgressBar from './ProgressBar';
import { LEVELS } from '../utils/points';
import { generateResume } from '../api/gemini';
// @ts-ignore
import html2pdf from 'html2pdf.js';
// import { UserData } from '../types';

// Типы шаблонов резюме
type ResumeTemplate = 'standard' | 'professional' | 'academic';

// Интерфейс данных резюме
interface ResumeData {
  education: string;
  skills: string;
  experience: string;
  achievements: string;
  languages: string[];
  portfolio: string;
}

// Расширяем интерфейс UserData
interface UserData {
  uid: string;
  role: 'school' | 'business'; // Разрешаем только роли, определенные в AuthContext
  bio?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  interests?: string[];
  location?: string;
  phoneNumber?: string;
  website?: string;
  company?: string;
  position?: string;
  yearsOfExperience?: number;
  displayName: string;
  photoURL?: string;
  university?: string;
  graduationYear?: string;
  major?: string;
  gpa?: string;
  industry?: string;
  employeeCount?: string;
  foundedYear?: string;
  linkedIn?: string;
  companyDescription?: string;
  resume?: ResumeData;
  resumeData?: ResumeData;
  points?: number;
  level?: number;
  totalXp?: number;
  email: string;
}

// Интерфейс для данных резюме, сгенерированного ИИ
interface AIResumeData {
  displayName: string;
  position: string;
  photoUrl: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  summary: string;
  skills: string[];
  education: {
    degree: string;
    school: string;
    dates: string;
  }[];
  languages: {
    lang: string;
    level: string;
  }[];
  interests: string[];
  experience: {
    title: string;
    company: string;
    dates: string;
    location: string;
    achievements: string[];
  }[];
  courses: {
    name: string;
    type: string;
    provider: string;
  }[];
}

// Пропсы компонента ResumeView
interface ResumeViewProps {
  resumeData: {
    education: string;
    skills: string;
    experience: string;
    achievements: string;
    languages: string[];
    portfolio: string;
  };
  displayName: string;
  template?: ResumeTemplate;
}

// Компонент ResumeView
const ResumeView: React.FC<ResumeViewProps> = ({ resumeData, displayName, template = 'standard' }) => {
  const getTemplateClasses = (): { container: string; section: string; heading: string; content: string } => {
    switch (template) {
      case 'professional':
        return {
          container: 'bg-white text-gray-800 p-8 rounded-lg shadow-lg border-l-4 border-blue-600',
          section: 'mb-6',
          heading: 'text-lg font-semibold text-blue-600 border-b border-gray-200 pb-1 mb-2',
          content: 'text-gray-700'
        };
      case 'academic':
        return {
          container: 'bg-white text-gray-800 p-8 rounded-lg shadow-lg border-t-4 border-green-600',
          section: 'mb-6',
          heading: 'text-lg font-semibold text-green-600 uppercase mb-2',
          content: 'text-gray-700'
        };
      default: // standard
        return {
          container: 'bg-white text-gray-800 p-8 rounded-lg shadow-lg',
          section: 'mb-6',
          heading: 'text-lg font-semibold text-gray-800 mb-2',
          content: 'text-gray-700'
        };
    }
  };

  const classes = getTemplateClasses();

  return (
    <div className={classes.container}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h1>
        <p className="text-gray-500">Резюме</p>
      </div>
      
      {resumeData.education && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Образование</h2>
          <div className={classes.content} dangerouslySetInnerHTML={{ __html: resumeData.education }}></div>
        </div>
      )}
      
      {resumeData.skills && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Навыки</h2>
          <div className={classes.content} dangerouslySetInnerHTML={{ __html: resumeData.skills }}></div>
        </div>
      )}
      
      {resumeData.experience && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Опыт работы</h2>
          <div className={classes.content} dangerouslySetInnerHTML={{ __html: resumeData.experience }}></div>
        </div>
      )}
      
      {resumeData.achievements && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Достижения</h2>
          <div className={classes.content} dangerouslySetInnerHTML={{ __html: resumeData.achievements }}></div>
        </div>
      )}
      
      {resumeData.languages && resumeData.languages.length > 0 && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Языки</h2>
          <div className={classes.content}>
            {resumeData.languages.join(', ')}
          </div>
        </div>
      )}
      
      {resumeData.portfolio && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Портфолио</h2>
          <div className={classes.content} dangerouslySetInnerHTML={{ __html: resumeData.portfolio }}></div>
        </div>
      )}
    </div>
  );
};

// Компонент AIResumeView
const AIResumeView: React.FC<{ userData: UserData; generatedHtml?: string }> = ({ userData, generatedHtml }) => {
  // Если есть generatedHtml, используем его вместо собственной верстки
  if (generatedHtml) {
    return (
      <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
    );
  }

  // Резервная верстка, если generatedHtml не предоставлен
  // Создаем структуру данных резюме на основе пользовательских данных
  const createResumeData = (): AIResumeData => {
    return {
      displayName: userData.displayName || '',
      position: userData.position || 'Профессионал',
      photoUrl: userData.photoURL || 'https://via.placeholder.com/150',
      contact: {
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        location: userData.location || 'Казахстан',
        linkedin: userData.linkedIn || '',
      },
      summary: userData.bio || 'Опытный профессионал с глубокими знаниями в своей отрасли.',
      skills: userData.skills || ['Коммуникация', 'Работа в команде', 'Решение проблем'],
      education: [
        {
          degree: userData.major || 'Степень',
          school: userData.university || 'Университет',
          dates: userData.graduationYear ? `${parseInt(userData.graduationYear) - 4} - ${userData.graduationYear}` : '2018 - 2022'
        }
      ],
      languages: userData.resumeData?.languages?.map(lang => ({
        lang,
        level: 'Свободно'
      })) || [
        { lang: 'Казахский', level: 'Родной' },
        { lang: 'Русский', level: 'Свободно' },
        { lang: 'Английский', level: 'B2' }
      ],
      interests: userData.interests || ['Технологии', 'Инновации', 'Саморазвитие'],
      experience: userData.experience?.map((exp, index) => ({
        title: exp.split(' at ')[0] || 'Должность',
        company: exp.split(' at ')[1] || 'Компания',
        dates: `${2022 - index} - ${index === 0 ? 'настоящее время' : (2022 - index + 2)}`,
        location: userData.location || 'Казахстан',
        achievements: [
          'Успешно завершил крупные проекты с значительными результатами',
          'Возглавлял инициативы команды, улучшившие производительность и сотрудничество',
          'Внедрил инновационные решения для сложных задач'
        ]
      })) || [
        {
          title: 'Старший специалист',
          company: 'Ведущая компания',
          dates: '2022 - настоящее время',
          location: 'Алматы',
          achievements: [
            'Успешно завершил крупные проекты с значительными результатами',
            'Возглавлял инициативы команды, улучшившие производительность и сотрудничество',
            'Внедрил инновационные решения для сложных задач'
          ]
        }
      ],
      courses: [
        {
          name: 'Профессиональное развитие',
          type: 'Сертификат',
          provider: 'Лидер отрасли'
        },
        {
          name: 'Обучение продвинутым навыкам',
          type: 'Онлайн-курс',
          provider: 'Образовательная платформа'
        }
      ]
    };
  };

  const resumeData = createResumeData();

  return (
    <div className="grid grid-cols-[250px_1fr] gap-8 p-8 bg-white text-gray-800">
      {/* Левая колонка */}
      <aside className="bg-gray-900 text-white p-6 rounded-lg">
        <img src={resumeData.photoUrl} className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-teal-400" alt={resumeData.displayName} />
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Контакты</h3>
          <ul className="space-y-1 text-sm">
            <li>📧 {resumeData.contact.email}</li>
            {resumeData.contact.phone && <li>📞 {resumeData.contact.phone}</li>}
            <li>📍 {resumeData.contact.location}</li>
            {resumeData.contact.linkedin && <li>🔗 {resumeData.contact.linkedin}</li>}
          </ul>
        </section>
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Навыки</h3>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gray-800 text-teal-400 rounded-full text-xs">
                {skill}
              </span>
            ))}
          </div>
        </section>
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Образование</h3>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="font-medium">{edu.degree}</div>
              <div className="text-sm text-gray-300">{edu.school}</div>
              <div className="text-xs text-gray-400">{edu.dates}</div>
            </div>
          ))}
        </section>
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Языки</h3>
          {resumeData.languages.map((lang, index) => (
            <div key={index} className="flex justify-between mb-1">
              <span>{lang.lang}</span>
              <span className="text-teal-400 text-sm">{lang.level}</span>
            </div>
          ))}
        </section>
        
        <section>
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Интересы</h3>
          <div className="flex flex-wrap gap-2">
            {resumeData.interests.map((interest, index) => (
              <span key={index} className="flex items-center text-sm">
                <span className="mr-1">•</span> {interest}
              </span>
            ))}
          </div>
        </section>
      </aside>
      
      {/* Правая колонка */}
      <main>
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{resumeData.displayName}</h1>
          <h2 className="text-xl text-gray-600">{resumeData.position}</h2>
          <p className="mt-4 text-gray-700 leading-relaxed">{resumeData.summary}</p>
        </header>
        
        <section className="mt-8">
          <h3 className="text-2xl font-semibold border-b pb-2 mb-4">Опыт работы</h3>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="mb-6">
              <h4 className="font-semibold text-lg">{exp.title}</h4>
              <span className="text-sm text-gray-500">
                {exp.company} • {exp.dates} • {exp.location}
              </span>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                {exp.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        
        <section className="mt-8">
          <h3 className="text-2xl font-semibold border-b pb-2 mb-4">Курсы и сертификаты</h3>
          {resumeData.courses.map((course, index) => (
            <p key={index} className="mt-3">
              <strong>{course.name}</strong>{' '}
              <span className="text-sm text-gray-500">({course.provider}, {course.type})</span>
            </p>
          ))}
        </section>
      </main>
    </div>
  );
};

const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  
  const [resumeEducation, setResumeEducation] = useState('');
  const [resumeSkills, setResumeSkills] = useState('');
  const [resumeExperience, setResumeExperience] = useState('');
  const [resumeAchievements, setResumeAchievements] = useState('');
  const [resumeLanguages, setResumeLanguages] = useState<string[]>([]);
  const [resumePortfolio, setResumePortfolio] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [resumeTemplate, setResumeTemplate] = useState<ResumeTemplate>('standard');
  const [autoResume, setAutoResume] = useState(false);
  
  // Ссылка для предпросмотра резюме (для экспорта в PDF)
  const resumeRef = useRef<HTMLDivElement>(null);
  const aiResumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          setEditedData(data);
          if (data.photoURL) {
            setAvatarPreview(data.photoURL);
          }
          
          // Загрузка данных резюме, если они доступны
          if (data.resumeData) {
            setResumeEducation(data.resumeData.education || '');
            setResumeSkills(data.resumeData.skills || '');
            setResumeExperience(data.resumeData.experience || '');
            setResumeAchievements(data.resumeData.achievements || '');
            setResumeLanguages(data.resumeData.languages || []);
            setResumePortfolio(data.resumeData.portfolio || '');
          }
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const trackProfileView = async () => {
      if (user && userData && user.uid !== userData.uid) {
        await addDoc(collection(db, 'profileViews'), {
          viewedUserId: userData.uid,
          viewerUserId: user.uid,
          timestamp: Date.now()
        });
      }
    };

    trackProfileView();
  }, [user, userData]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return null;
    
    const avatarRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
    await uploadBytes(avatarRef, avatarFile);
    const downloadURL = await getDownloadURL(avatarRef);
    return downloadURL;
  };

  const handleSave = async () => {
    if (user && editedData) {
      try {
        let photoURL = editedData.photoURL;
        
        if (avatarFile) {
          const uploadedUrl = await uploadAvatar();
          if (uploadedUrl) {
            photoURL = uploadedUrl;
          }
        }

        const updateData = {
          role: editedData.role,
          bio: editedData.bio || null,
          skills: editedData.skills || [],
          experience: editedData.experience || [],
          education: editedData.education || [],
          interests: editedData.interests || [],
          location: editedData.location || null,
          phoneNumber: editedData.phoneNumber || null,
          website: editedData.website || null,
          company: editedData.company || null,
          position: editedData.position || null,
          yearsOfExperience: editedData.yearsOfExperience || null,
          displayName: editedData.displayName || null,
          photoURL: photoURL || null,
          companyDescription: editedData.companyDescription || null,
          industry: editedData.industry || null,
          employeeCount: editedData.employeeCount || null,
          foundedYear: editedData.foundedYear || null,
          linkedIn: editedData.linkedIn || null,
          university: editedData.university || null,
          graduationYear: editedData.graduationYear || null,
          major: editedData.major || null,
          gpa: editedData.gpa || null
        };

        await updateDoc(doc(db, 'users', user.uid), updateData);
        
        if (editedData.displayName || photoURL) {
          await updateProfile(user, {
            displayName: editedData.displayName || null,
            photoURL: photoURL || null
          });
        }
        
        setUserData({...editedData, photoURL});
        setIsEditing(false);
      } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
      }
    }
  };

  const handleAddSkill = () => {
    if (newSkill && editedData) {
      setEditedData({
        ...editedData,
        skills: [...(editedData.skills || []), newSkill]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        skills: editedData.skills?.filter(skill => skill !== skillToRemove)
      });
    }
  };

  const handleAddExperience = () => {
    if (newExperience && editedData) {
      setEditedData({
        ...editedData,
        experience: [...(editedData.experience || []), newExperience]
      });
      setNewExperience('');
    }
  };

  const handleSaveResume = async () => {
    if (user && editedData) {
      const resumeData = {
        education: resumeEducation,
        skills: resumeSkills,
        experience: resumeExperience,
        achievements: resumeAchievements,
        languages: resumeLanguages,
        portfolio: resumePortfolio
      };

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          resumeData
        });
        
        // Обновление локального состояния
        setUserData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            resumeData
          };
        });
        
        alert('Резюме успешно сохранено!');
      } catch (error) {
        console.error('Ошибка при сохранении резюме:', error);
        alert('Произошла ошибка при сохранении резюме. Пожалуйста, попробуйте еще раз.');
      }
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage && !resumeLanguages.includes(newLanguage)) {
      setResumeLanguages([...resumeLanguages, newLanguage]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setResumeLanguages(resumeLanguages.filter(l => l !== lang));
  };

  const getLevelInfo = (level: number) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  };

  const handleGenerateAIResume = async () => {
    if (!editedData) return;
    
    try {
      setIsGeneratingResume(true);
      
      // Сбор данных профиля для ИИ
      const profileData = {
        displayName: editedData.displayName,
        education: resumeEducation || editedData.education?.join("\n") || '',
        skills: editedData.skills || [],
        experience: editedData.experience || [],
        university: editedData.university || '',
        major: editedData.major || '',
        languages: resumeLanguages.length > 0 ? resumeLanguages : ['Казахский', 'Русский'],
        location: editedData.location || 'Казахстан',
        position: editedData.position || '',
        bio: editedData.bio || '',
        yearsOfExperience: editedData.yearsOfExperience || 0,
        achievements: resumeAchievements || '',
        portfolio: resumePortfolio || '',
        email: editedData.email || '',
        phoneNumber: editedData.phoneNumber || '',
        linkedIn: editedData.linkedIn || '',
        photoURL: editedData.photoURL || 'https://via.placeholder.com/150',
        interests: editedData.interests || []
      };
      
      // Вызов API для генерации резюме
      const response = await generateResume(profileData);
      
      if (response.success && 'data' in response && response.data) {
        const htmlContent = response.data;
        setGeneratedResume(htmlContent);
        setGeneratedHtml(htmlContent);
        
        // С новым HTML-форматом не нужно парсить секции
        // Просто сохраняем полный HTML и используем его напрямую
        
        // Автоматический переход на просмотр AI-резюме
        setAutoResume(true);
        
        // Показываем сообщение об успехе
        alert('Резюме успешно сгенерировано! Сейчас отображается версия резюме, созданная ИИ.');
      } else {
        alert('Не удалось сгенерировать резюме. Пожалуйста, попробуйте позже.');
      }
    } catch (error) {
      console.error('Ошибка при генерации резюме:', error);
      alert('Произошла ошибка при генерации резюме. Пожалуйста, попробуйте позже.');
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // Экспорт резюме в PDF
  const exportResumeToPDF = () => {
    // Используем ссылку на AI-резюме, если autoResume=true, иначе стандартное резюме
    const element = autoResume ? aiResumeRef.current : resumeRef.current;
    
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `${userData?.displayName || 'резюме'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Отправка резюме работодателю (при отклике на вакансию)
  const sendResumeToEmployer = async (jobId: string, employerId: string) => {
    if (!user || !userData?.resumeData) return false;
    
    try {
      // Сохранение отклика с прикрепленным резюме
      await setDoc(doc(db, `applications/${jobId}/responses/${user.uid}`), {
        studentId: user.uid,
        employerId,
        displayName: userData?.displayName,
        resumeData: userData.resumeData,
        submittedAt: new Date(),
        status: 'ожидает'
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка при отправке резюме работодателю:', error);
      return false;
    }
  };

  if (!user || !userData) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gradient-to-br dark:from-[#1e1e2f] dark:to-[#11111b] bg-gray-50 rounded-3xl shadow-lg dark:shadow-2xl p-8 space-y-8">
          {/* Секция прогресса */}
          {userData.role === 'school' && (
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/30 dark:to-accent/30 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 dark:text-white text-gray-800 flex items-center">
                <span className="mr-2">🎯</span> Прогресс
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/90 dark:bg-white/5 p-4 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Уровень</div>
                  <div className="text-gray-900 dark:text-white font-bold text-xl">
                    {userData.level || 1} - {getLevelInfo(userData.level || 1).title}
                  </div>
                </div>
                <div className="bg-white/90 dark:bg-white/5 p-4 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Баллы</div>
                  <div className="text-primary font-bold text-xl">
                    {userData.points || 0} баллов
                  </div>
                </div>
                <div className="bg-white/90 dark:bg-white/5 p-4 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Всего XP</div>
                  <div className="text-accent font-bold text-xl">
                    {userData.totalXp || 0} XP
                  </div>
                </div>
              </div>
              <ProgressBar 
                currentXp={userData.totalXp || 0}
                level={userData.level || 1}
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-white dark:to-gray-300 dark:bg-clip-text dark:text-transparent">
              Мой профиль
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-primary/80 hover:bg-primary px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 text-white"
            >
              {isEditing ? 'Отмена' : 'Редактировать профиль'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 ring-2 ring-white/10">
                    {(avatarPreview || editedData?.photoURL) ? (
                      <img 
                        src={avatarPreview || editedData?.photoURL} 
                        alt="Профиль" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <input
                    type="text"
                    value={editedData?.displayName || ''}
                    onChange={(e) => setEditedData({...editedData!, displayName: e.target.value})}
                    placeholder="Отображаемое имя"
                    className="w-full px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <input
                    type="text"
                    value={editedData?.location || ''}
                    onChange={(e) => setEditedData({...editedData!, location: e.target.value})}
                    placeholder="Местоположение"
                    className="w-full px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">О себе</label>
                  <textarea
                    value={editedData?.bio || ''}
                    onChange={(e) => setEditedData({...editedData!, bio: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px]"
                    placeholder="Расскажите о себе..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Образование</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedData?.university || ''}
                      onChange={(e) => setEditedData({...editedData!, university: e.target.value})}
                      placeholder="Университет"
                      className="w-full px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <input
                      type="text"
                      value={editedData?.major || ''}
                      onChange={(e) => setEditedData({...editedData!, major: e.target.value})}
                      placeholder="Специальность"
                      className="w-full px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <input
                      type="text"
                      value={editedData?.graduationYear || ''}
                      onChange={(e) => setEditedData({...editedData!, graduationYear: e.target.value})}
                      placeholder="Год окончания"
                      className="w-full px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Навыки</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedData?.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center group hover:bg-primary/30 transition-all"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-primary/70 hover:text-primary/100 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Добавить навык"
                    className="flex-1 px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-primary/80 hover:bg-primary rounded-xl transition-all hover:scale-105"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Опыт работы</label>
                <div className="space-y-3 mb-3">
                  {editedData?.experience?.map((exp, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <span className="flex-1 px-4 py-2 bg-white/5 rounded-xl">{exp}</span>
                      <button
                        onClick={() => setEditedData({
                          ...editedData!,
                          experience: editedData.experience?.filter((_, i) => i !== index)
                        })}
                        className="text-primary/70 hover:text-primary/100 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    placeholder="Добавить опыт"
                    className="flex-1 px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button
                    onClick={handleAddExperience}
                    className="px-4 py-2 bg-primary/80 hover:bg-primary rounded-xl transition-all hover:scale-105"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              
              {editedData?.role === 'school' && (
                <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                  <h3 className="text-xl font-semibold text-primary">Информация для резюме</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Шаблон резюме</label>
                      <select
                        value={resumeTemplate}
                        onChange={(e) => setResumeTemplate(e.target.value as ResumeTemplate)}
                        className="w-full px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="standard">Стандартный</option>
                        <option value="professional">Профессиональный</option>
                        <option value="academic">Академический</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Образование</label>
                      <textarea
                        value={resumeEducation}
                        onChange={(e) => setResumeEducation(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                        placeholder="Например: КазНУ, факультет ИТ, 2018–2022, специальность, GPA, курсы..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Подробные навыки</label>
                      <textarea
                        value={resumeSkills}
                        onChange={(e) => setResumeSkills(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                        placeholder="Например: Python, JavaScript, React, SQL, машинное обучение, Figma, Adobe Photoshop..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Опыт работы</label>
                      <textarea
                        value={resumeExperience}
                        onChange={(e) => setResumeExperience(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px]"
                        placeholder="Например: компания, должность, период работы, ключевые обязанности и достижения..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Достижения</label>
                      <textarea
                        value={resumeAchievements}
                        onChange={(e) => setResumeAchievements(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                        placeholder="Например: победитель HackNU 2023, сертификат Google Digital Garage, IELTS 7.5..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Языки</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {resumeLanguages.map((lang: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center group hover:bg-primary/30 transition-all"
                          >
                            {lang}
                            <button
                              onClick={() => handleRemoveLanguage(lang)}
                              className="ml-2 text-primary/70 hover:text-primary/100 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="Например: казахский, русский, английский..."
                        />
                        <button
                          onClick={handleAddLanguage}
                          className="px-4 py-2 bg-primary/80 hover:bg-primary rounded-xl transition-all hover:scale-105"
                        >
                          Добавить
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Портфолио/Проекты</label>
                      <textarea
                        value={resumePortfolio}
                        onChange={(e) => setResumePortfolio(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                        placeholder="Например: github.com/username, ссылки на проекты, Telegram-боты, сайты..."
                      />
                    </div>
                  </div>

                  <div className="mt-4 mb-6">
                    <button
                      onClick={handleGenerateAIResume}
                      className="w-full mb-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-600/20 flex items-center justify-center"
                      disabled={isGeneratingResume}
                    >
                      {isGeneratingResume ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Генерация...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Сгенерировать AI-резюме
                        </>
                      )}
                    </button>
                    
                    {generatedResume && (
                      <div className="mb-6 p-4 bg-white/10 rounded-xl">
                        <h4 className="text-primary font-semibold mb-2">Предпросмотр AI-резюме</h4>
                        <div className="whitespace-pre-line text-sm text-gray-300 max-h-60 overflow-y-auto p-3 bg-black/20 rounded-lg">
                          {generatedResume}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          ИИ заполнил поля вашего резюме на основе вашего профиля. Вы можете отредактировать их перед сохранением.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleSaveResume}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-green-600/20"
                    >
                      Сохранить резюме
                    </button>
                    
                    <button
                      onClick={exportResumeToPDF}
                      className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gray-600/20"
                    >
                      Экспорт в PDF
                  </button>
                  </div>
                  
                  {/* Предпросмотр резюме */}
                  {(resumeEducation || resumeSkills || resumeExperience || resumeAchievements || resumeLanguages.length > 0 || resumePortfolio) && (
                    <div className="mt-8">
                      <h4 className="text-xl font-semibold text-primary mb-3">Предпросмотр резюме</h4>
                      
                      <div className="bg-gray-800 rounded-xl p-3 shadow-inner">
                        <div ref={resumeRef}>
                          <ResumeView 
                            resumeData={{
                              education: resumeEducation,
                              skills: resumeSkills,
                              experience: resumeExperience,
                              achievements: resumeAchievements,
                              languages: resumeLanguages,
                              portfolio: resumePortfolio
                            }} 
                            displayName={editedData.displayName || 'Пользователь'}
                            template={resumeTemplate}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
              >
                Сохранить изменения
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 ring-2 ring-gray-200 dark:ring-white/10">
                  {userData.photoURL ? (
                    <img 
                      src={userData.photoURL} 
                      alt="Профиль" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{userData.displayName || 'Анонимный пользователь'}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-sm text-gray-800 dark:text-gray-300">
                      {userData.role === 'school' ? 'Студент' : userData.role === 'business' ? 'Бизнес' : 'Пользователь'}
                    </span>
                    {userData.location && (
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 text-sm">
                        <span>📍</span> {userData.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all group">
                  <h4 className="text-lg font-semibold text-primary mb-3">О себе</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {userData.bio || 'Биография не добавлена'}
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all group">
                  <h4 className="text-lg font-semibold text-primary mb-3">Навыки</h4>
                  {userData.skills && userData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/20 rounded-full text-sm text-gray-800 dark:text-gray-100 group-hover:bg-primary/30 transition-all"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Навыки не добавлены</p>
                  )}
                </div>

                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all group">
                  <h4 className="text-lg font-semibold text-primary mb-3">Опыт работы</h4>
                  {userData.experience && userData.experience.length > 0 ? (
                    <div className="space-y-2">
                      {userData.experience.map((exp, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white/70 dark:bg-black/20 rounded-xl text-sm text-gray-700 dark:text-gray-300"
                        >
                          {exp}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Опыт работы не добавлен</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-primary mb-4">Образование</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Университет:</span> {userData.university || 'Не указано'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Специальность:</span> {userData.major || 'Не указано'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Год окончания:</span> {userData.graduationYear || 'Не указано'}
                  </p>
                </div>
              </div>

              {userData?.role === 'business' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all group">
                    <h4 className="text-lg font-semibold text-primary mb-3">Информация о компании</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">Отрасль:</span> {userData.industry || 'Не указано'}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">Размер компании:</span> {userData.employeeCount || 'Не указано'}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">Год основания:</span> {userData.foundedYear || 'Не указано'}
                      </p>
                    </div>
                  </div>

                  {userData.linkedIn && (
                    <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all group">
                      <h4 className="text-lg font-semibold text-primary mb-3">Социальные сети</h4>
                      <a 
                        href={userData.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn компании
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Отображение резюме для студентов */}
              {userData?.role === 'school' && userData.resume && (
                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                  <h3 className="text-xl font-semibold text-primary">Резюме</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">Образование</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{userData.resume.education}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">Навыки</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{userData.resume.skills}</p>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">Опыт работы</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{userData.resume.experience}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">Достижения</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{userData.resume.achievements}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">Языки</h4>
                      <div className="flex flex-wrap gap-2">
                        {userData.resume.languages.map((lang: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/20 rounded-full text-sm"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {userData.resume.portfolio && (
                      <div className="md:col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">Портфолио и проекты</h4>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{userData.resume.portfolio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Отображение резюме для студентов в режиме просмотра */}
              {userData?.role === 'school' && userData.resumeData && !isEditing && (
                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6 mt-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-primary">Резюме</h3>
                    <div className="flex space-x-3">
                      <select
                        value={resumeTemplate}
                        onChange={(e) => setResumeTemplate(e.target.value as ResumeTemplate)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-gray-800 dark:text-gray-300"
                      >
                        <option value="standard">Стандартный</option>
                        <option value="professional">Профессиональный</option>
                        <option value="academic">Академический</option>
                      </select>
                      
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoResume}
                            onChange={() => setAutoResume(!autoResume)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">AI-резюме</span>
                        </label>
                      </div>
                      
                      <button
                        onClick={exportResumeToPDF}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-1 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 8 8-8 l-4 4 m0 0 l-4-4 m4 4 V4" />
                        </svg>
                        <span>Экспорт в PDF</span>
                        </button>
                      </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-inner">
                    {autoResume ? (
                      <div ref={aiResumeRef}>
                        <AIResumeView userData={userData} generatedHtml={generatedHtml || undefined} />
                      </div>
                    ) : (
                      <div ref={resumeRef}>
                        <ResumeView 
                          resumeData={userData.resumeData}
                          displayName={userData.displayName || 'Пользователь'}
                          template={resumeTemplate}
                        />
                      </div>
                    )}
                </div>
              )
            </div>
          )}
        </div>
  )}
    </div>
    </div>
    </div> 
  ); }
  
export default Profile;