import React, { useState, useEffect, useCallback, Component, ErrorInfo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, Firestore, limit, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import CreateChat from './CreateChat';

// Demo employer ID that will be used for all demo jobs
const DEMO_EMPLOYER_ID = 'demo-employer-official';

// Function to ensure demo employer exists in Firebase
const ensureDemoEmployerExists = async () => {
  try {
    const demoEmployerRef = doc(db, 'users', DEMO_EMPLOYER_ID);
    const demoEmployerDoc = await getDoc(demoEmployerRef);
    
    if (!demoEmployerDoc.exists()) {
      console.log("Creating demo employer account");
      await setDoc(demoEmployerRef, {
        displayName: "Demo Employer",
        email: "demo@jumys.al",
        photoURL: "/images/default-avatar.jpg",
        role: "employer",
        createdAt: new Date(),
        isVerified: true
      });
      console.log("Demo employer created successfully");
    } else {
      console.log("Demo employer already exists");
    }
    
    return DEMO_EMPLOYER_ID;
  } catch (error) {
    console.error("Error ensuring demo employer exists:", error);
    return null;
  }
};

// Simple hardcoded demo data to ensure we always have something to display
const DEMO_JOBS = [
  {
    id: 'demo-job-1',
    title: 'Frontend Developer',
    description: 'We are looking for a frontend developer with React experience',
    companyName: 'TechCorp',
    location: 'Алматы',
    employmentType: 'Полная занятость',
    experience: '1-3 года',
    salary: '150,000 - 300,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-2',
    title: 'Backend Developer',
    description: 'Required Node.js developer with experience in building RESTful APIs',
    companyName: 'Digital Solutions',
    location: 'Астана',
    employmentType: 'Полная занятость',
    experience: '2-5 лет',
    salary: '200,000 - 350,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-3',
    title: 'UX/UI Designer',
    description: 'Creative designer to work on our mobile application',
    companyName: 'CreativeMinds',
    location: 'Удаленно',
    employmentType: 'Частичная занятость',
    experience: '1-3 года',
    salary: '180,000 - 250,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-4',
    title: 'DevOps Engineer',
    description: 'Setting up and maintaining CI/CD pipelines for our products',
    companyName: 'CloudTech',
    location: 'Алматы',
    employmentType: 'Полная занятость',
    experience: '3-5 лет',
    salary: '300,000 - 450,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-5',
    title: 'Product Manager',
    description: 'Lead the development of our new fintech product',
    companyName: 'FinInnovate',
    location: 'Астана',
    employmentType: 'Полная занятость',
    experience: '5+ лет',
    salary: '400,000 - 600,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  }
];

// Simple failsafe fallback component
const JobFallback = () => (
  <div className="relative min-h-screen bg-gray-50 dark:bg-dark overflow-hidden pt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-card p-6 text-center">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Не удалось загрузить вакансии
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Произошла ошибка при загрузке данных. Пожалуйста, перезагрузите страницу или попробуйте позже.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Перезагрузить страницу
        </button>
      </div>
    </div>
  </div>
);

// Error boundary to catch runtime errors
class JobsErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, errorMessage: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
    console.log("JobsErrorBoundary initialized");
  }

  static getDerivedStateFromError(error: Error) {
    console.error("Error caught in JobsErrorBoundary:", error);
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught in componentDidCatch:", error);
    console.error("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">Произошла ошибка</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Не удалось загрузить страницу вакансий.
            </p>
            {this.state.errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg mb-4 text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Детали ошибки:</p>
                <p className="mt-1">{this.state.errorMessage}</p>
              </div>
            )}
            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple function to check Firebase connectivity
const checkFirebaseConnection = async () => {
  console.log("Checking Firebase connection...");
  try {
    // Try to access a small collection or document that should always exist
    const testQuery = query(collection(db, "posts"), limit(1));
    console.log("Created test query for posts collection");
    
    try {
      const querySnapshot = await getDocs(testQuery);
      console.log("Firebase connection check result:", { 
        connected: true, 
        docs: querySnapshot.size,
        empty: querySnapshot.empty
      });
      return true;
    } catch (queryError) {
      console.error("Firebase query execution failed:", queryError);
      return false;
    }
  } catch (error) {
    console.error("Firebase connection check failed with error:", error);
    // Try to provide more specific error information
    if (error instanceof Error) {
      console.error("Error name:", error.name, "Error message:", error.message);
    }
    return false;
  }
};

// At the very beginning of the file, right after the imports
console.log("📂 Jobs.tsx module loading");

// Add this function to create an absolute minimal component
const createMinimalJobsList = () => {
  console.log("Creating minimal jobs fallback");
  return (
    <div className="p-4 m-4 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl mb-4">Вакансии</h1>
      <p className="text-lg mb-4">Демо-данные для отладки:</p>
      <ul className="list-disc pl-5">
        {DEMO_JOBS.map(job => (
          <li key={job.id} className="mb-2">
            <strong>{job.title}</strong> - {job.companyName} ({job.location})
          </li>
        ))}
      </ul>
      <p className="mt-4 text-red-500">Страница отображается в аварийном режиме</p>
    </div>
  );
};

// Fallback function to fetch jobs directly using Firebase REST API
const fetchJobsDirectly = async (): Promise<Post[] | null> => {
  try {
    console.log("Attempting to fetch jobs via direct REST API call...");
    const projectId = "jumysal-a5ce4"; // Your Firebase project ID
    const apiKey = "AIzaSyBFrDVlsCR8dDChhNr1bly5qvxC-tnzEhU"; // Your Firebase API key
    
    // Construct the Firebase REST API URL for querying the collection
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts?key=${apiKey}`;
    
    console.log("Sending REST API request to Firebase...");
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Firebase REST API request failed:", response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log("Firebase REST API response received:", data);
    
    if (!data.documents || !data.documents.length) {
      console.log("No documents found in REST API response");
      return null;
    }
    
    // Transform Firestore REST API response format to our Post format
    const jobs = data.documents
      .map((doc: any) => {
        // Extract the document ID from the name path
        const id = doc.name.split('/').pop();
        
        // Extract fields and convert from Firestore value format
        const fields: any = {};
        Object.entries(doc.fields || {}).forEach(([key, value]: [string, any]) => {
          // Handle different Firestore value types
          if (value.stringValue !== undefined) fields[key] = value.stringValue;
          else if (value.booleanValue !== undefined) fields[key] = value.booleanValue;
          else if (value.integerValue !== undefined) fields[key] = parseInt(value.integerValue);
          else if (value.doubleValue !== undefined) fields[key] = value.doubleValue;
          else if (value.timestampValue !== undefined) fields[key] = new Date(value.timestampValue);
          else if (value.arrayValue !== undefined) {
            fields[key] = value.arrayValue.values?.map((v: any) => {
              return v.stringValue || v.integerValue || v.booleanValue || v.doubleValue;
            }) || [];
          }
          // Add more type handling as needed
        });
        
        return { id, ...fields } as Post;
      })
      .filter((post: any) => post.type === 'job'); // Filter to only include job posts
    
    console.log("Successfully parsed jobs from REST API:", jobs.length);
    return jobs.length > 0 ? jobs : null;
  } catch (error) {
    console.error("Error in direct jobs fetch:", error);
    return null;
  }
};

// Функция для преобразования типа
const ensurePostType = (post: any): Post => {
  return {
    id: post.id,
    title: post.title || 'Без названия',
    description: post.description || '',
    companyName: post.companyName || 'Неизвестная компания',
    location: post.location || 'Не указано',
    employmentType: post.employmentType || post.employment || 'Не указано',
    experience: post.experience || post.experienceLevel || 'Не указано',
    salary: post.salary || 'Не указано',
    createdAt: post.createdAt || new Date(),
    type: post.type || 'job', // Default to job type
    userId: post.authorId || post.userId || DEMO_EMPLOYER_ID, // Ensure userId is set
    ...post // Preserve all other properties
  };
};

const Jobs = () => {
  console.log("💥 JOBS COMPONENT FUNCTION BODY EXECUTING 💥");
  
  // Error safety mechanism to catch all rendering errors
  const [hasFatalError, setHasFatalError] = useState(false);
  
  // If something catastrophic happens during rendering
  if (hasFatalError) {
    return <JobFallback />;
  }
  
  try {
    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [jobs, setJobs] = useState<Post[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Post[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<{
      location: string;
      employmentType: string;
      experience: string;
    }>({
      location: '',
      employmentType: '',
      experience: ''
    });
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const { user } = useAuth();
    const navigate = useNavigate();

    // Функция для принудительного обновления
    const forceUpdate = useCallback(() => {
      console.log("Forcing update of Jobs component");
      setLastUpdate(new Date());
      fetchJobs();
    }, []);

    // Fetch jobs function definition here
    const fetchJobs = async (retryCount = 0) => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching jobs...");
        
        // Ensure demo employer exists for demo jobs
        await ensureDemoEmployerExists();
        
        // Check Firebase connection first
        const isConnected = await checkFirebaseConnection();
        console.log("Firebase connection status:", isConnected);
        
        if (!isConnected) {
          console.log("Firebase connection failed, trying direct API...");
          
          // Try direct REST API as a fallback
          const directJobs = await fetchJobsDirectly();
          
          if (directJobs && directJobs.length > 0) {
            console.log("Successfully fetched jobs via direct API");
            setJobs(directJobs);
            setFilteredJobs(directJobs);
            setLoading(false);
            return;
          }
          
          console.log("Direct API also failed, falling back to demo data");
          setError("Не удалось подключиться к базе данных. Используются демо-данные.");
          setJobs(DEMO_JOBS as unknown as Post[]);
          setFilteredJobs(DEMO_JOBS as unknown as Post[]);
          setLoading(false);
          return;
        }
        
        console.log("Firebase connection successful, fetching jobs");
        
        try {
          const jobsCollection = collection(db, 'posts');
          console.log("Created posts collection reference");
          
          // ИЗМЕНЕНИЕ 1: Более простой запрос для начала - получить все посты, потом отфильтровать программно
          const q = query(jobsCollection, orderBy('createdAt', 'desc'));
          console.log("Created query for all posts");
          
          // Get all jobs
          console.log("Executing posts query...");
          try {
            const querySnapshot = await getDocs(q);
            console.log("Query executed, result size:", querySnapshot.size);
            console.log("Query parameters:", { 
              collection: 'posts', 
              orderBy: 'createdAt desc' 
            });
            
            if (querySnapshot.empty) {
              console.log("No posts found in Firestore, using demo data");
              setError("В данный момент нет активных вакансий. Показаны демонстрационные примеры.");
              setJobs(DEMO_JOBS as unknown as Post[]);
              setFilteredJobs(DEMO_JOBS as unknown as Post[]);
            } else {
              // Получаем все посты и фильтруем программно, это может помочь увидеть проблему
              const allPosts = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log("Post found:", { 
                  id: doc.id, 
                  type: data.type, 
                  title: data.title,
                  createdAt: data.createdAt?.toDate?.() || data.createdAt
                });
                return {
                  id: doc.id,
                  ...data
                };
              });
              
              console.log("All posts fetched:", allPosts.length);
              
              // ИЗМЕНЕНИЕ 2: Фильтруем программно, чтобы видеть какие посты есть, но не проходят фильтр
              const jobsData = allPosts.filter(post => {
                // Включаем вакансии с type = 'job' или без указания типа (для обратной совместимости)
                const postType = post.type;
                console.log(`Post ${post.id} has type: ${postType}`);
                return postType === 'job' || postType === undefined || postType === null;
              }).map(post => ensurePostType(post)); // Используем функцию для обеспечения правильной типизации
              
              console.log("Filtered job posts:", jobsData.length);
              
              if (jobsData.length > 0) {
                setJobs(jobsData as Post[]);
                setFilteredJobs(jobsData as Post[]);
              } else {
                console.log("No job posts after filtering, showing demo data");
                setError("Найдены посты, но нет вакансий с type='job'. Используются демо-данные.");
                // Показываем все посты для отладки вместо демо
                if (allPosts.length > 0) {
                  console.log("Showing all posts instead of demo");
                  setJobs(allPosts as Post[]);
                  setFilteredJobs(allPosts as Post[]);
                } else {
                  setJobs(DEMO_JOBS as unknown as Post[]);
                  setFilteredJobs(DEMO_JOBS as unknown as Post[]);
                }
              }
            }
          } catch (queryErr) {
            console.error("Error executing query:", queryErr);
            throw queryErr; // Rethrow to be caught by the outer catch block
          }
        } catch (jobErr) {
          console.error("Error fetching job posts:", jobErr);
          
          // Retry logic for transient errors (up to 2 retries)
          if (retryCount < 2) {
            console.log(`Retrying job fetch (attempt ${retryCount + 1})...`);
            setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
          
          setError("Не удалось загрузить вакансии из базы данных. Используются демо-данные.");
          setJobs(DEMO_JOBS as unknown as Post[]);
          setFilteredJobs(DEMO_JOBS as unknown as Post[]);
        }
        
        // Get saved jobs if user is logged in
        if (user) {
          try {
            const savedJobsQuery = query(
              collection(db, 'savedPosts'),
              where('userId', '==', user.uid)
            );
            
            const savedJobsSnapshot = await getDocs(savedJobsQuery);
            const savedIds = savedJobsSnapshot.docs.map(doc => doc.data().postId);
            setSavedJobIds(savedIds);
          } catch (savedErr) {
            console.error("Error fetching saved jobs:", savedErr);
            // Non-blocking error, continue with empty saved jobs
            setSavedJobIds([]);
          }
        }
      } catch (err) {
        console.error("Error in jobs fetching process:", err);
        setError("Не удалось загрузить вакансии из базы данных. Используются демо-данные.");
        
        // Fallback to demo jobs on error
        setJobs(DEMO_JOBS as unknown as Post[]);
        setFilteredJobs(DEMO_JOBS as unknown as Post[]);
      } finally {
        setLoading(false);
      }
    };
    
    // Manual retry function
    const handleRetryFetch = () => {
      console.log("Manual retry of job fetching initiated by user");
      forceUpdate();
    };

    // Fetch jobs on component mount and when URL params change
    useEffect(() => {
      console.log("Jobs useEffect triggered, lastUpdate:", lastUpdate);
      fetchJobs();
      
      // Add event listener for page visibility to refresh when user returns to the page
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log("Page became visible, refreshing jobs...");
          fetchJobs();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up event listener
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [user, lastUpdate]);

    // Apply filters when search or filter changes
    useEffect(() => {
      console.log("Applying filters to jobs:", jobs?.length);
      if (!jobs || jobs.length === 0) {
        console.log("No jobs to filter, using demo data");
        setJobs(DEMO_JOBS as unknown as Post[]);
        setFilteredJobs(DEMO_JOBS as unknown as Post[]);
        return;
      }
      
      try {
        const filtered = jobs.filter(job => {
          // Handle potential undefined properties safely
          const jobTitle = job?.title?.toLowerCase?.() || '';
          const jobCompany = job?.companyName?.toLowerCase?.() || '';
          const searchTerm = search.toLowerCase();
          
          const matchSearch = !search || jobTitle.includes(searchTerm) || jobCompany.includes(searchTerm);
          const matchLocation = !filter.location || job?.location === filter.location;
          const matchType = !filter.employmentType || job?.employmentType === filter.employmentType;
          const matchExperience = !filter.experience || 
                                job?.experienceLevel === filter.experience ||
                                job?.experience === filter.experience;

          return matchSearch && matchLocation && matchType && matchExperience;
        });

        setFilteredJobs(filtered);
      } catch (err) {
        console.error("Error applying filters:", err);
        // On error, show all jobs
        setFilteredJobs(jobs);
      }
    }, [search, filter, jobs]);

    // Save/Unsave job functionality
    const toggleSaveJob = async (jobId: string) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      
      try {
        const savedJobRef = doc(db, 'savedPosts', `${user.uid}_${jobId}`);
        const savedJobDoc = await getDoc(savedJobRef);
        
        if (savedJobDoc.exists()) {
          await deleteDoc(savedJobRef);
          setSavedJobIds(prev => prev.filter(id => id !== jobId));
        } else {
          await setDoc(savedJobRef, {
            userId: user.uid,
            postId: jobId,
            savedAt: new Date()
          });
          setSavedJobIds(prev => [...prev, jobId]);
        }
      } catch (error) {
        console.error('Error toggling saved job:', error);
        setError('Unable to save job. Please try again.');
      }
    };

    // The main render
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-dark overflow-hidden pt-16">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
        <div className="absolute top-40 right-[10%] w-64 h-64 bg-primary/5 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-10"></div>
        <div className="absolute bottom-40 left-[5%] w-64 h-64 bg-accent/5 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-10"></div>
        
        {/* Error message banner if needed */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-700 dark:text-yellow-200">{error}</p>
              </div>
              <button
                onClick={handleRetryFetch}
                className="ml-4 px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Повторить попытку
              </button>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Загрузка вакансий...</p>
            </div>
          </div>
        ) : (
          /* Main content */
          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 animate-fadeInUp">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl text-center">
              <span className="block text-primary dark:text-accent">Вакансии</span>
              <span className="block text-2xl font-medium mt-2 text-gray-500 dark:text-gray-400">
                Найдите работу своей мечты
              </span>
            </h1>

            {/* Search and filters */}
            <div className="mt-12 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по ключевым словам..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                  <select
                    value={filter.location}
                    onChange={(e) => setFilter({...filter, location: e.target.value})}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Все города</option>
                    <option value="Алматы">Алматы</option>
                    <option value="Астана">Астана</option>
                    <option value="Шымкент">Шымкент</option>
                    <option value="Караганда">Караганда</option>
                    <option value="Удаленно">Удаленно</option>
                  </select>
                  
                  <select
                    value={filter.employmentType}
                    onChange={(e) => setFilter({...filter, employmentType: e.target.value})}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Тип занятости</option>
                    <option value="Полная">Полная</option>
                    <option value="Частичная">Частичная</option>
                    <option value="Проектная">Проектная</option>
                    <option value="Стажировка">Стажировка</option>
                  </select>
                  
                  <select
                    value={filter.experience}
                    onChange={(e) => setFilter({...filter, experience: e.target.value})}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Опыт работы</option>
                    <option value="Без опыта">Без опыта</option>
                    <option value="1-3 года">1-3 года</option>
                    <option value="3-5 лет">3-5 лет</option>
                    <option value="5+ лет">5+ лет</option>
                  </select>
                </div>
              </div>

              {/* Job listings */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <div key={job.id} className="py-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <Link to={`/jobs/${job.id}`} className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-accent">
                            {job.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                              {job.location}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                              {job.employmentType}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                              {job.experience}
                            </span>
                            {job.salary && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                {job.salary}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        <div className="mt-4 md:mt-0 flex items-center space-x-3">
                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              savedJobIds.includes(job.id)
                                ? 'text-red-600 bg-red-50 hover:bg-red-100 focus:ring-red-500 dark:bg-red-900/20 dark:hover:bg-red-800/30 dark:text-red-400'
                                : 'text-gray-400 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={savedJobIds.includes(job.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          
                          {job.userId && (
                            <CreateChat
                              recipientId={job.userId}
                              postId={job.id}
                              postTitle={job.title || 'Вакансия'}
                              initiateButtonText="Откликнуться"
                              buttonClassName="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Вакансии не найдены</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Попробуйте изменить параметры поиска или сбросить фильтры.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setSearch('');
                          setFilter({
                            location: '',
                            employmentType: '',
                            experience: ''
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary dark:text-accent bg-primary/10 dark:bg-accent/10 hover:bg-primary/20 dark:hover:bg-accent/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Сбросить все фильтры
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    );
  } catch (error) {
    console.error("Fatal error in Jobs component:", error);
    return <JobFallback />;
  }
};

// At the bottom of the file, modify the export
export default function JobsWithErrorBoundary() {
  console.log("JobsWithErrorBoundary rendering");
  
  // Absolute fallback in case the ErrorBoundary itself fails
  try {
    return (
      <JobsErrorBoundary>
        <Jobs />
      </JobsErrorBoundary>
    );
  } catch (criticalError) {
    console.error("Critical error in Jobs error boundary:", criticalError);
    // Return an absolute minimal component
    return createMinimalJobsList();
  }
}; 