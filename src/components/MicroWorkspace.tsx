import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MicroInternship, MicroApplication, MicroMessage } from '../types';
import MicroAIChat from './MicroAIChat';

const MicroWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<MicroInternship | null>(null);
  const [application, setApplication] = useState<MicroApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'submission'>('overview');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messages, setMessages] = useState<MicroMessage[]>([]);

  // Demo data
  const demoInternship: MicroInternship = {
    id: '1',
    title: 'Create a React Landing Page',
    description: 'Build a responsive landing page using React and Tailwind CSS. The page should include a hero section, features, testimonials, and a contact form.',
    requirements: ['HTML/CSS', 'JavaScript', 'React', 'Responsive Design'],
    skills: ['react', 'tailwind', 'responsive-design'],
    employerId: 'employer1',
    employer: {
      id: 'employer1',
      name: 'Айгерим Нұрланова',
      company: 'TechBoost Kazakhstan',
      photoURL: 'https://randomuser.me/api/portraits/women/45.jpg'
    },
    xpReward: 100,
    badgeId: 'react-frontend-1',
    badgeName: 'React Developer I',
    badgeImageUrl: 'https://cdn-icons-png.flaticon.com/512/1183/1183672.png',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(),
    status: 'active',
    difficulty: 'beginner',
    estimatedHours: 3,
    category: 'Web Development',
    applicationsCount: 7,
    completionsCount: 2,
    aiTechSpec: `
## Technical Specification for React Landing Page

### Project Overview
Create a responsive landing page for TechBoost Kazakhstan using React and Tailwind CSS.

### Requirements

#### 1. Page Structure
- Hero section with compelling headline and call-to-action
- Features section (3-4 key features with icons)
- Testimonials carousel/section
- Contact form with validation
- Footer with social links and copyright

#### 2. Technical Requirements
- Use React (Create React App or Vite)
- Implement Tailwind CSS for styling
- Ensure responsive design (mobile, tablet, desktop)
- Form validation for the contact form
- Basic animations for enhanced UX

#### 3. Deliverables
- Source code on GitHub repository
- Deployment link (Vercel, Netlify, or GitHub Pages)
- Brief documentation on how to run the project locally

#### 4. Timeline
- Complete within 3 days

### Getting Started
1. Set up a new React project with Tailwind CSS
2. Create component structure for each section
3. Implement responsive design using Tailwind's utility classes
4. Add form validation logic
5. Test across different devices and browsers
6. Deploy to hosting platform
7. Submit GitHub repository and deployment link

### Resources
- TechBoost brand colors: #3B82F6 (primary), #1E3A8A (secondary), #FFFFFF (background)
- React documentation: https://reactjs.org/docs/getting-started.html
- Tailwind CSS documentation: https://tailwindcss.com/docs
- Free icons: https://heroicons.com/ or https://feathericons.com/
`
  };

  const demoApplication: MicroApplication = {
    id: 'app1',
    microInternshipId: '1',
    studentId: user?.uid || 'unknown',
    student: {
      id: user?.uid || 'unknown',
      name: userData?.displayName || 'Unknown User',
      photoURL: userData?.photoURL,
      level: 1
    },
    status: 'in-progress',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // In a real implementation, we would fetch from Firestore
        // For demo, use our demo data
        setInternship(demoInternship);
        setApplication(demoApplication);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleSendMessage = (text: string, senderType: 'student' | 'employer' | 'ai' = 'student') => {
    const newMessage: MicroMessage = {
      id: Date.now().toString(),
      senderId: senderType === 'student' ? user?.uid || 'unknown' : 'ai',
      senderType,
      text,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // In a real implementation, we would save this to Firestore
    // const messagesRef = collection(db, 'microApplications', application.id, 'messages');
    // await addDoc(messagesRef, newMessage);
  };

  const handleSubmitProject = async () => {
    if (!projectUrl.trim()) {
      alert('Пожалуйста, добавьте ссылку на ваш проект');
      return;
    }
    
    setSubmitLoading(true);
    
    try {
      // In a real implementation, we would update the application in Firestore
      setTimeout(() => {
        setApplication(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'submitted',
            submissionUrl: projectUrl,
            submissionNotes: projectNotes,
            submissionDate: new Date()
          };
        });
        setSubmitLoading(false);
        alert('Проект успешно отправлен на проверку!');
      }, 1500);
    } catch (error) {
      console.error('Error submitting project:', error);
      setSubmitLoading(false);
      alert('Произошла ошибка при отправке проекта');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
      </div>
    );
  }

  if (error || !internship || !application) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-8 text-center">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {error || 'Не удалось загрузить данные'}
          </h3>
          <button
            onClick={() => navigate('/micro-internships')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-16">
      <div className="bg-white dark:bg-dark-lighter shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {internship.title}
              </h1>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  application.status === 'in-progress' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : application.status === 'submitted'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : application.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {application.status === 'in-progress' ? 'В процессе' : 
                   application.status === 'submitted' ? 'На проверке' : 
                   application.status === 'completed' ? 'Завершено' : 
                   application.status}
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Дедлайн: {typeof internship.deadline === 'string' 
                    ? internship.deadline
                    : new Date(internship.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate(`/micro-internships/${id}`)}
                className="text-primary dark:text-accent hover:underline text-sm font-medium"
              >
                Вернуться к описанию
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'overview'
                  ? 'bg-primary text-white dark:bg-accent'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'chat'
                  ? 'bg-primary text-white dark:bg-accent'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              AI-ментор
            </button>
            <button
              onClick={() => setActiveTab('submission')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'submission'
                  ? 'bg-primary text-white dark:bg-accent'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Отправка решения
            </button>
          </nav>
        </div>
        
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden">
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Техническое задание
                </h2>
                <div className="markdown-content mt-4 whitespace-pre-line">
                  {internship.aiTechSpec}
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Награды по завершению
                  </h3>
                  <div className="flex items-center mt-2">
                    <img 
                      src={internship.badgeImageUrl} 
                      alt={internship.badgeName} 
                      className="h-12 w-12" 
                    />
                    <div className="ml-3">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {internship.badgeName}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        +{internship.xpReward} XP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="p-0 h-[70vh]">
              <MicroAIChat 
                microInternshipId={internship.id}
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
          
          {activeTab === 'submission' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Отправка решения
              </h2>
              
              {application.status === 'submitted' || application.status === 'completed' ? (
                <div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                          Решение отправлено
                        </h3>
                        <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                          <p>Ваше решение находится на проверке. Вы получите уведомление, когда оно будет проверено.</p>
                          <p className="mt-2">
                            Дата отправки: {application.submissionDate instanceof Date 
                              ? application.submissionDate.toLocaleString() 
                              : new Date().toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Детали отправки
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Ссылка на проект
                        </p>
                        <p className="mt-1">
                          <a 
                            href={application.submissionUrl || projectUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {application.submissionUrl || projectUrl}
                          </a>
                        </p>
                      </div>
                      
                      {(application.submissionNotes || projectNotes) && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Примечания
                          </p>
                          <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-line">
                            {application.submissionNotes || projectNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ссылка на проект (GitHub, deployed site, etc.) *
                      </label>
                      <input
                        type="text"
                        id="projectUrl"
                        value={projectUrl}
                        onChange={(e) => setProjectUrl(e.target.value)}
                        placeholder="https://github.com/username/project"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="projectNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Примечания к проекту
                      </label>
                      <textarea
                        id="projectNotes"
                        value={projectNotes}
                        onChange={(e) => setProjectNotes(e.target.value)}
                        placeholder="Опишите особенности вашего решения, сложности, с которыми вы столкнулись, или любую другую информацию, которую хотите сообщить."
                        rows={5}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter shadow-sm focus:border-primary focus:ring-primary dark:focus:border-accent dark:focus:ring-accent dark:text-white"
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSubmitProject}
                        disabled={submitLoading || !projectUrl.trim()}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark disabled:opacity-50"
                      >
                        {submitLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Отправка...
                          </>
                        ) : (
                          'Отправить на проверку'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicroWorkspace; 