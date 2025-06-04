import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MicroInternship } from '../types';

const MicroInternships: React.FC = () => {
  const [microInternships, setMicroInternships] = useState<MicroInternship[]>([]);
  const [featuredInternships, setFeaturedInternships] = useState<MicroInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  // Categories for filtering
  const categories = ['Web Development', 'Mobile Development', 'Data Analysis', 'Design', 'Content Creation', 'Marketing'];
  
  // Demo data for development
  const demoInternships: MicroInternship[] = [
    {
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
      completionsCount: 2
    },
    {
      id: '2',
      title: 'Build a Financial Dashboard with Chart.js',
      description: 'Create an interactive financial dashboard that visualizes expense categories, income trends, and saving goals using Chart.js.',
      requirements: ['JavaScript', 'Chart.js', 'Data Visualization', 'CSS Grid'],
      skills: ['javascript', 'chartjs', 'data-visualization'],
      employerId: 'employer2',
      employer: {
        id: 'employer2',
        name: 'Арман Сәрсенов',
        company: 'KaspiBank',
        photoURL: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      xpReward: 150,
      badgeId: 'data-viz-1',
      badgeName: 'Data Visualization Pro',
      badgeImageUrl: 'https://cdn-icons-png.flaticon.com/512/4581/4581853.png',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
      difficulty: 'intermediate',
      estimatedHours: 4,
      category: 'Data Analysis',
      applicationsCount: 5,
      completionsCount: 1
    },
    {
      id: '3',
      title: 'Create a School Timetable Mobile UI',
      description: 'Design a mobile interface for a school timetable app that is intuitive and visually appealing. Focus on user experience and accessibility.',
      requirements: ['UI/UX Design', 'Figma', 'Mobile Design Principles'],
      skills: ['figma', 'ui-design', 'ux-design', 'mobile-design'],
      employerId: 'employer3',
      employer: {
        id: 'employer3',
        name: 'Дінмұхамед Қасымов',
        company: 'DesignHub',
        photoURL: 'https://randomuser.me/api/portraits/men/22.jpg'
      },
      xpReward: 120,
      badgeId: 'ui-designer-1',
      badgeName: 'UI Designer I',
      badgeImageUrl: 'https://cdn-icons-png.flaticon.com/512/3159/3159310.png',
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'active',
      difficulty: 'beginner',
      estimatedHours: 3,
      category: 'Design',
      applicationsCount: 9,
      completionsCount: 3
    },
    {
      id: '4',
      title: 'Social Media Content Calendar',
      description: 'Create a monthly content calendar for our social media platforms (Instagram, Facebook, LinkedIn) focused on technology education.',
      requirements: ['Content Strategy', 'Social Media', 'Education Marketing'],
      skills: ['content-planning', 'social-media', 'education-marketing'],
      employerId: 'employer4',
      employer: {
        id: 'employer4',
        name: 'Талгатов Даниял',
        company: 'EduTech Solutions',
        photoURL: 'https://randomuser.me/api/portraits/women/68.jpg'
      },
      xpReward: 90,
      badgeId: 'content-strategist-1',
      badgeName: 'Content Strategist I',
      badgeImageUrl: 'https://cdn-icons-png.flaticon.com/512/2282/2282188.png',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'active',
      difficulty: 'beginner',
      estimatedHours: 2,
      category: 'Content Creation',
      applicationsCount: 4,
      completionsCount: 1
    },
    {
      id: '5',
      title: 'Develop a Python Data Analysis Tool',
      description: 'Create a Python script that processes CSV data for student performance analytics, generates insights, and visualizes trends.',
      requirements: ['Python', 'Pandas', 'Data Analysis', 'Matplotlib/Seaborn'],
      skills: ['python', 'pandas', 'data-analysis', 'matplotlib'],
      employerId: 'employer5',
      employer: {
        id: 'employer5',
        name: 'Бауыржан Есимов',
        company: 'DataSmart Analytics',
        photoURL: 'https://randomuser.me/api/portraits/men/52.jpg'
      },
      xpReward: 180,
      badgeId: 'python-data-1',
      badgeName: 'Python Data Analyst I',
      badgeImageUrl: 'https://cdn-icons-png.flaticon.com/512/6132/6132220.png',
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      status: 'active',
      difficulty: 'advanced',
      estimatedHours: 5,
      category: 'Data Analysis',
      applicationsCount: 3,
      completionsCount: 0
    }
  ];

  useEffect(() => {
    const fetchMicroInternships = async () => {
      setLoading(true);
      try {
        // In a real implementation, we would fetch from Firestore
        // const microInternshipsRef = collection(db, 'microInternships');
        // const q = query(microInternshipsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
        // const querySnapshot = await getDocs(q);
        // const internships = querySnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data()
        // })) as MicroInternship[];
        
        // Using demo data for now
        setMicroInternships(demoInternships);
        
        // Set featured internships (highest XP reward)
        const featured = [...demoInternships].sort((a, b) => b.xpReward - a.xpReward).slice(0, 3);
        setFeaturedInternships(featured);
      } catch (error) {
        console.error('Error fetching micro-internships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMicroInternships();
  }, []);

  // Filter internships based on selected category, difficulty, and search query
  const filteredInternships = microInternships.filter(internship => {
    const matchesCategory = selectedCategory ? internship.category === selectedCategory : true;
    const matchesDifficulty = selectedDifficulty ? internship.difficulty === selectedDifficulty : true;
    const matchesSearch = searchQuery 
      ? internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleInternshipClick = (internship: MicroInternship) => {
    navigate(`/micro-internships/${internship.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-16">
      {/* Header with title and search */}
      <div className="bg-white dark:bg-dark-lighter py-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Микро-стажировки <span className="text-primary dark:text-accent">с AI-менторством</span>
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Выполняйте реальные задачи, получайте менторство и зарабатывайте digital-бейджи
              </p>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по навыкам, названию..."
                  className="w-full md:w-64 px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent dark:bg-dark-lighter dark:text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Featured Internships */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Отличные возможности для вас
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredInternships.map(internship => (
              <div
                key={internship.id}
                onClick={() => handleInternshipClick(internship)}
                className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden cursor-pointer transform transition hover:scale-105 hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent px-2 py-1 rounded text-xs">
                      {internship.category}
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {internship.xpReward} XP
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {internship.title}
                  </h3>
                  
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {internship.description}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {internship.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {skill}
                      </span>
                    ))}
                    {internship.skills.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        +{internship.skills.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={internship.employer.photoURL} 
                        alt={internship.employer.name} 
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {internship.employer.company}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {typeof internship.deadline === 'string' 
                        ? internship.deadline
                        : `${Math.ceil((new Date(internship.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} дней`}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <img
                            key={i}
                            className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-dark-lighter"
                            src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${20 + i}.jpg`}
                            alt=""
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {internship.applicationsCount} участников
                      </span>
                    </div>
                    <div className="flex items-center">
                      <img 
                        src={internship.badgeImageUrl} 
                        alt={internship.badgeName} 
                        className="h-6 w-6 mr-1" 
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {internship.badgeName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Filter tabs and categories */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all' 
                    ? 'bg-primary text-white dark:bg-accent' 
                    : 'bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300'
                }`}
              >
                Все стажировки
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'applied' 
                    ? 'bg-primary text-white dark:bg-accent' 
                    : 'bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300'
                }`}
              >
                Мои заявки
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'completed' 
                    ? 'bg-primary text-white dark:bg-accent' 
                    : 'bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300'
                }`}
              >
                Завершенные
              </button>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="text-sm rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                className="text-sm rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-lighter text-gray-700 dark:text-gray-300"
              >
                <option value="">Все уровни</option>
                <option value="beginner">Начальный</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Internships Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredInternships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map(internship => (
              <div
                key={internship.id}
                onClick={() => handleInternshipClick(internship)}
                className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent px-2 py-1 rounded text-xs">
                      {internship.category}
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        internship.difficulty === 'beginner' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : internship.difficulty === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {internship.difficulty === 'beginner' ? 'Начальный' : 
                         internship.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {internship.title}
                  </h3>
                  
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {internship.description}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {internship.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {skill}
                      </span>
                    ))}
                    {internship.skills.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        +{internship.skills.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center space-x-1">
                        <img 
                          src={internship.badgeImageUrl} 
                          alt={internship.badgeName} 
                          className="h-5 w-5" 
                        />
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          {internship.xpReward} XP
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ~{internship.estimatedHours} часов
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center">
                      <img 
                        className="h-6 w-6 rounded-full" 
                        src={internship.employer.photoURL} 
                        alt={internship.employer.name} 
                      />
                      <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                        {internship.employer.company}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Дедлайн: {typeof internship.deadline === 'string' 
                        ? internship.deadline
                        : `${Math.ceil((new Date(internship.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} дней`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Не найдено микро-стажировок</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Попробуйте изменить фильтры или вернитесь позже, когда появятся новые микро-стажировки
            </p>
          </div>
        )}
        
        {/* Create new micro-internship button (only for employers) */}
        {userData?.role === 'business' && (
          <div className="mt-12 text-center">
            <Link
              to="/micro-internships/create"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать микро-стажировку
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroInternships; 