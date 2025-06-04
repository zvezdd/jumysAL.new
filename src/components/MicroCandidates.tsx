import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import { MicroInternship, MicroApplication, UserData } from '../types';
import { evaluateCandidates, CandidateEvaluation } from '../services/aiCandidateService';

const MicroCandidates: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [internship, setInternship] = useState<MicroInternship | null>(null);
  const [applications, setApplications] = useState<MicroApplication[]>([]);
  const [candidateResults, setCandidateResults] = useState<CandidateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Demo data for development purposes
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
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    status: 'active',
    difficulty: 'beginner',
    estimatedHours: 3,
    category: 'Web Development',
    applicationsCount: 7,
    completionsCount: 2
  };
  
  // Demo applications
  const demoApplications: MicroApplication[] = [
    {
      id: 'app1',
      microInternshipId: '1',
      studentId: 'student1',
      student: {
        id: 'student1',
        name: 'Алмас Сейтжанов',
        photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
        level: 2
      },
      status: 'applied',
      messages: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'app2',
      microInternshipId: '1',
      studentId: 'student2',
      student: {
        id: 'student2',
        name: 'Айнур Ахметова',
        photoURL: 'https://randomuser.me/api/portraits/women/31.jpg',
        level: 3
      },
      status: 'applied',
      messages: [],
      createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'app3',
      microInternshipId: '1',
      studentId: 'student3',
      student: {
        id: 'student3',
        name: 'Нурлан Касымов',
        photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
        level: 1
      },
      status: 'applied',
      messages: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];
  
  // Demo user data for enriching applications
  const demoUserData: Record<string, UserData> = {
    'student1': {
      uid: 'student1',
      email: 'almas@example.com',
      displayName: 'Алмас Сейтжанов',
      role: 'student',
      skills: ['javascript', 'react', 'html', 'css'],
      education: 'KBTU, Computer Science, 2nd year',
      experience: '6 months internship at tech startup',
      bio: 'Passionate about frontend development and UI/UX design',
      university: 'KBTU',
      major: 'Computer Science',
      graduationYear: '2025',
      photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
      level: 2
    },
    'student2': {
      uid: 'student2',
      email: 'ainur@example.com',
      displayName: 'Айнур Ахметова',
      role: 'student',
      skills: ['html', 'css', 'design', 'figma', 'ui/ux'],
      education: 'Nazarbayev University, Design, 3rd year',
      experience: 'Worked on several design projects',
      bio: 'Creative designer with a focus on user experience',
      university: 'Nazarbayev University',
      major: 'Design',
      graduationYear: '2024',
      photoURL: 'https://randomuser.me/api/portraits/women/31.jpg',
      level: 3
    },
    'student3': {
      uid: 'student3',
      email: 'nurlan@example.com',
      displayName: 'Нурлан Касымов',
      role: 'student',
      skills: ['python', 'data analysis', 'javascript'],
      education: 'ENU, Information Systems, 1st year',
      experience: 'No professional experience yet',
      bio: 'Learning web development, interested in frontend technologies',
      university: 'ENU',
      major: 'Information Systems',
      graduationYear: '2026',
      photoURL: 'https://randomuser.me/api/portraits/men/75.jpg',
      level: 1
    }
  };
  
  // Effect for loading data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, we would fetch from Firestore
        // const internshipDoc = await getDoc(doc(db, 'microInternships', id));
        // if (!internshipDoc.exists()) {
        //   setError('Micro-internship not found');
        //   setLoading(false);
        //   return;
        // }
        
        // const internshipData = {
        //   id: internshipDoc.id,
        //   ...internshipDoc.data()
        // } as MicroInternship;
        
        // setInternship(internshipData);
        
        // For demo purposes
        setInternship(demoInternship);
        
        // Check if user has permission to view candidates (is the employer)
        // In a real implementation, we would check if user.uid === internshipData.employerId
        // if (user?.uid !== internshipData.employerId) {
        //   setError('You do not have permission to view candidates for this micro-internship');
        //   setLoading(false);
        //   return;
        // }
        
        // Fetch applications
        // In a real implementation:
        // const applicationsQuery = query(
        //   collection(db, 'microApplications'),
        //   where('microInternshipId', '==', id),
        //   where('status', '==', 'applied')
        // );
        // const applicationsSnapshot = await getDocs(applicationsQuery);
        // const applicationsList = applicationsSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data()
        // })) as MicroApplication[];
        
        // For demo purposes
        setApplications(demoApplications);
        setUserDataMap(demoUserData);
        
        // Fetch user data for each applicant
        // In a real implementation:
        // const studentIds = applicationsList.map(app => app.studentId);
        // const userData: Record<string, UserData> = {};
        
        // for (const studentId of studentIds) {
        //   const userDoc = await getDoc(doc(db, 'users', studentId));
        //   if (userDoc.exists()) {
        //     userData[studentId] = userDoc.data() as UserData;
        //   }
        // }
        
        // setUserDataMap(userData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user]);
  
  // Function to evaluate candidates with Gemini API
  const handleEvaluateCandidates = async () => {
    if (!internship || applications.length === 0) return;
    
    setEvaluating(true);
    setError(null);
    
    try {
      // In a production environment, we would call Firebase Cloud Function
      // const evaluateAllFn = httpsCallable(functions, 'evaluateAllCandidates');
      // const result = await evaluateAllFn({ microInternshipId: internship.id, limit: 10 });
      // const { evaluations } = result.data as { evaluations: CandidateEvaluation[] };
      
      // For development/demo, we'll use the client-side service
      const evaluations = await evaluateCandidates(internship, applications, userDataMap);
      
      setCandidateResults(evaluations);
    } catch (error) {
      console.error('Error evaluating candidates:', error);
      setError('Failed to evaluate candidates. Please try again later.');
    } finally {
      setEvaluating(false);
    }
  };
  
  // Function to handle accepting a candidate
  const handleAcceptCandidate = async (applicationId: string) => {
    if (!internship) return;
    
    try {
      // In a real implementation, we would update the application status in Firestore
      // await updateDoc(doc(db, 'microApplications', applicationId), {
      //   status: 'in-progress',
      //   updatedAt: serverTimestamp()
      // });
      
      // For demo, just update locally
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'in-progress' as const, updatedAt: new Date() }
            : app
        )
      );
      
      alert('Candidate accepted successfully. They will be notified to start working on the micro-internship.');
    } catch (error) {
      console.error('Error accepting candidate:', error);
      alert('Failed to accept candidate. Please try again.');
    }
  };
  
  // Function to handle rejecting a candidate
  const handleRejectCandidate = async (applicationId: string) => {
    if (!internship) return;
    
    try {
      // In a real implementation, we would update the application status in Firestore
      // await updateDoc(doc(db, 'microApplications', applicationId), {
      //   status: 'rejected',
      //   updatedAt: serverTimestamp()
      // });
      
      // For demo, just update locally
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'rejected' as const, updatedAt: new Date() }
            : app
        )
      );
      
      alert('Candidate rejected. They will be notified about your decision.');
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      alert('Failed to reject candidate. Please try again.');
    }
  };
  
  // Function to toggle showing details for a candidate
  const toggleCandidateDetails = (candidateId: string) => {
    setShowDetails(prevId => prevId === candidateId ? null : candidateId);
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
            {error || 'Micro-internship not found'}
          </h3>
          <button
            onClick={() => navigate('/micro-internships')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark"
          >
            Back to Micro-internships
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
                Candidates for: {internship.title}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {applications.length} applications received
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate(`/micro-internships/${id}`)}
                className="text-primary dark:text-accent hover:underline text-sm font-medium"
              >
                Back to Micro-internship
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleEvaluateCandidates}
            disabled={evaluating || applications.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Evaluating...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                AI Evaluate Candidates
              </>
            )}
          </button>
        </div>
        
        {candidateResults.length > 0 ? (
          <div className="bg-white dark:bg-dark-lighter shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {candidateResults.map((evaluation, index) => {
                const application = applications.find(app => app.studentId === evaluation.candidateId);
                const userData = userDataMap[evaluation.candidateId];
                
                if (!application) return null;
                
                return (
                  <li key={evaluation.candidateId}>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* Rank */}
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-300 font-semibold">{index + 1}</span>
                          </div>
                          
                          {/* Candidate info */}
                          <div className="ml-4 flex items-center">
                            <img 
                              className="h-12 w-12 rounded-full"
                              src={application.student.photoURL || 'https://via.placeholder.com/150'}
                              alt={application.student.name}
                            />
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {application.student.name}
                              </h3>
                              <div className="flex items-center mt-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Level {application.student.level}
                                </span>
                                {userData?.skills && (
                                  <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                                    {userData.skills.slice(0, 3).join(', ')}
                                    {userData.skills.length > 3 && '...'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Match score */}
                        <div className="flex flex-col items-end">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {evaluation.match}% Match
                          </div>
                          <button
                            onClick={() => toggleCandidateDetails(evaluation.candidateId)}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-1"
                          >
                            {showDetails === evaluation.candidateId ? 'Hide details' : 'Show details'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded details */}
                      {showDetails === evaluation.candidateId && (
                        <div className="mt-4 px-4 py-4 bg-gray-50 dark:bg-dark-light rounded-md">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              AI Evaluation
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300">
                              {evaluation.reason}
                            </p>
                          </div>
                          
                          {userData && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Education
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300">
                                  {userData.education || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Experience
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300">
                                  {userData.experience || 'Not specified'}
                                </p>
                              </div>
                              {userData.skills && (
                                <div className="md:col-span-2">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {userData.skills.map(skill => (
                                      <span 
                                        key={skill}
                                        className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons */}
                          <div className="flex justify-end space-x-3 mt-4">
                            <button
                              onClick={() => handleRejectCandidate(application.id)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-lighter hover:bg-gray-50 dark:hover:bg-dark"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAcceptCandidate(application.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-lighter shadow rounded-lg p-8">
            {applications.length > 0 ? (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No evaluated candidates yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click the "AI Evaluate Candidates" button to get AI-powered evaluations for candidates.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No applications yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  There are no applications for this micro-internship yet. Check back later.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroCandidates; 