import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MicroInternship, MicroApplication } from '../types';

const MicroInternshipDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<MicroInternship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userApplication, setUserApplication] = useState<MicroApplication | null>(null);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [applyConfirmation, setApplyConfirmation] = useState(false);

  // Demo data for development
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

  useEffect(() => {
    const fetchInternship = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // In a real implementation, we would fetch from Firestore
        // const internshipDoc = await getDoc(doc(db, 'microInternships', id));
        // if (internshipDoc.exists()) {
        //   setInternship({
        //     id: internshipDoc.id,
        //     ...internshipDoc.data()
        //   } as MicroInternship);
        // } else {
        //   setError('Микро-стажировка не найдена');
        // }
        
        // Using demo data for now
        setInternship(demoInternship);
        
        // Check if the user has already applied
        if (user) {
          // In a real implementation, we would fetch the user's application
          // const applicationsRef = collection(db, 'microApplications');
          // const q = query(applicationsRef, 
          //                where('microInternshipId', '==', id),
          //                where('studentId', '==', user.uid));
          // const querySnapshot = await getDocs(q);
          // if (!querySnapshot.empty) {
          //   setUserApplication({
          //     id: querySnapshot.docs[0].id,
          //     ...querySnapshot.docs[0].data()
          //   } as MicroApplication);
          // }
        }
      } catch (error) {
        console.error('Error fetching micro-internship:', error);
        setError('Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [id, user]);

  const handleApply = async () => {
    if (!user || !userData || !internship) return;
    
    // In a real implementation, we would create an application in Firestore
    // try {
    //   const newApplication = {
    //     microInternshipId: internship.id,
    //     studentId: user.uid,
    //     student: {
    //       id: user.uid,
    //       name: userData.displayName || 'Unknown User',
    //       photoURL: userData.photoURL,
    //       level: userData.level || 1
    //     },
    //     status: 'applied',
    //     messages: [],
    //     createdAt: serverTimestamp(),
    //     updatedAt: serverTimestamp()
    //   };
    //   
    //   const docRef = await addDoc(collection(db, 'microApplications'), newApplication);
    //   setUserApplication({ id: docRef.id, ...newApplication } as MicroApplication);
    //   
    //   // Update the applicationsCount on the internship
    //   await updateDoc(doc(db, 'microInternships', internship.id), {
    //     applicationsCount: (internship.applicationsCount || 0) + 1
    //   });
    // } catch (error) {
    //   console.error('Error applying for internship:', error);
    //   setError('Произошла ошибка при подаче заявки');
    // }
    
    // For demo, just set a mock application
    const mockApplication: MicroApplication = {
      id: 'app1',
      microInternshipId: internship.id,
      studentId: user?.uid || '',
      student: {
        id: user?.uid || '',
        name: userData?.displayName || 'Unknown User',
        photoURL: userData?.photoURL,
        level: 1 // Use a default value instead of userData?.level
      },
      status: 'applied',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setUserApplication(mockApplication);
    setApplyConfirmation(true);
    setTimeout(() => setApplyConfirmation(false), 3000);
  };

  const handleGetAIGuidance = () => {
    if (!internship?.aiTechSpec) {
      // In a real implementation, we would generate this with an API call
      // const generateTechSpec = async () => {
      //   try {
      //     const response = await fetch('/api/generate-tech-spec', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ internship })
      //     });
      //     const data = await response.json();
      //     setAiGuidance(data.techSpec);
      //   } catch (error) {
      //     console.error('Error generating tech spec:', error);
      //   }
      // };
      // generateTechSpec();
    } else {
      setAiGuidance(internship.aiTechSpec);
    }
    setShowGuidanceModal(true);
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Начальный';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-8 text-center">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {error || 'Микро-стажировка не найдена'}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Apply confirmation message */}
        {applyConfirmation && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-6 py-3 rounded-md shadow-lg z-50 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Вы успешно подали заявку на участие!</span>
          </div>
        )}
        
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button 
                onClick={() => navigate('/micro-internships')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Микро-стажировки
              </button>
            </li>
            <li>
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 dark:text-white font-medium">
                {internship.title}
              </span>
            </li>
          </ol>
        </nav>
        
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1 mr-0 md:mr-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent px-3 py-1 rounded-full text-sm">
                    {internship.category}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    internship.difficulty === 'beginner' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : internship.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {getDifficultyLabel(internship.difficulty)}
                  </div>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      ~{internship.estimatedHours} часов
                    </span>
                  </div>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {internship.title}
                </h1>
                
                <div className="mt-4 flex items-center">
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={internship.employer.photoURL} 
                    alt={internship.employer.name} 
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {internship.employer.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {internship.employer.company}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Описание
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {internship.description}
                  </p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Требуемые навыки
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {internship.requirements.map(req => (
                      <div key={req} className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        {req}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10">
                  <button
                    onClick={handleGetAIGuidance}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Получить AI-подсказку и ТЗ
                  </button>
                </div>
              </div>
              
              <div className="mt-8 md:mt-0 bg-gray-50 dark:bg-dark p-6 rounded-lg shadow-inner w-full md:w-80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img 
                      src={internship.badgeImageUrl} 
                      alt={internship.badgeName} 
                      className="h-12 w-12" 
                    />
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {internship.badgeName}
                      </h3>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        +{internship.xpReward} XP
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Дедлайн:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {typeof internship.deadline === 'string' 
                        ? internship.deadline
                        : new Date(internship.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Осталось дней:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {typeof internship.deadline === 'string' 
                        ? 'N/A'
                        : Math.max(0, Math.ceil((new Date(internship.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Участники:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {internship.applicationsCount} чел.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Завершили:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {internship.completionsCount} чел.
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {!userApplication ? (
                    <button
                      onClick={handleApply}
                      disabled={!user}
                      className="w-full py-3 px-6 bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
                    >
                      Присоединиться к проекту
                    </button>
                  ) : (
                    <div>
                      <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg mb-4">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Вы участвуете</span>
                        </div>
                        <p className="text-sm mt-1">Статус: {userApplication.status === 'applied' ? 'Заявка подана' : userApplication.status}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/micro-internships/workspace/${internship.id}`)}
                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium shadow-sm"
                      >
                        Перейти к рабочему пространству
                      </button>
                    </div>
                  )}
                  
                  {!user && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                      Войдите, чтобы подать заявку
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Guidance Modal */}
      {showGuidanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-lighter rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI-инструкция и техническое задание
              </h3>
              <button 
                onClick={() => setShowGuidanceModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="prose dark:prose-invert max-w-none">
                {aiGuidance ? (
                  <div className="markdown-content whitespace-pre-line">
                    {aiGuidance}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={() => setShowGuidanceModal(false)}
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium"
              >
                Закрыть
              </button>
              {aiGuidance && (
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Скачать в PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroInternshipDetail; 