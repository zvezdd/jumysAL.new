import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, Post } from '../types';

// You would need to implement or import an actual text generation API
// This is a placeholder for the actual implementation
const generateTextWithAI = async (prompt: string): Promise<string> => {
  // In a real implementation, this would call an AI service like OpenAI's API
  console.log("Sending prompt to AI service:", prompt);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a placeholder response
  return "This is a generated resume based on your profile and the job requirements. In a real implementation, this would be a professionally crafted resume tailored to the specific job.";
};

interface AIResumeGeneratorProps {
  post?: Post;
  onClose?: () => void;
  onSubmit?: (resumeText: string) => void;
}

const AIResumeGenerator: React.FC<AIResumeGeneratorProps> = ({ post, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          setError('User profile not found. Please complete your profile first.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user profile. Please try again.');
      }
    };

    fetchUserData();
  }, [user]);

  const generateResume = async () => {
    if (!userData) {
      setError('Please complete your profile before generating a resume');
      return;
    }

    if (!post) {
      setError('No job post selected for resume generation');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Prepare user profile data
      const userProfile = {
        name: userData.displayName || '',
        education: Array.isArray(userData.education) ? userData.education : [userData.education || ''],
        skills: Array.isArray(userData.skills) ? userData.skills : [userData.skills || ''],
        experience: Array.isArray(userData.experience) ? userData.experience : [userData.experience || ''],
        achievements: userData.achievements || '',
        languages: Array.isArray(userData.languages) ? userData.languages : [userData.languages || ''],
        portfolio: userData.portfolio || ''
      };

      // Prepare job post data
      const jobDetails = {
        title: post.title,
        company: post.companyName || post.company || '',
        description: post.description,
        requirements: Array.isArray(post.requirements) ? post.requirements.join(', ') : (post.requirements || ''),
        responsibilities: Array.isArray(post.responsibilities) ? post.responsibilities.join(', ') : (post.responsibilities || '')
      };

      // Construct prompt for AI
      const prompt = `
        Generate a professional resume for a job application with the following details:

        APPLICANT PROFILE:
        Name: ${userProfile.name}
        Education: ${userProfile.education.join(', ')}
        Skills: ${userProfile.skills.join(', ')}
        Experience: ${userProfile.experience.join(', ')}
        Achievements: ${userProfile.achievements}
        Languages: ${userProfile.languages.join(', ')}
        Portfolio/Projects: ${userProfile.portfolio}

        JOB DETAILS:
        Position: ${jobDetails.title}
        Company: ${jobDetails.company}
        Job Description: ${jobDetails.description}
        Requirements: ${jobDetails.requirements}
        Responsibilities: ${jobDetails.responsibilities}

        Create a professional, concise resume that highlights the applicant's relevant qualifications for this specific job. Format it appropriately for a job application in Kazakhstan's job market. Focus on matching the applicant's experiences and skills with the job requirements.
      `;

      // Call AI service to generate resume
      const generatedText = await generateTextWithAI(prompt);
      setGeneratedResume(generatedText);
      
    } catch (error) {
      console.error('Error generating resume:', error);
      setError('Failed to generate resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit && !generatedResume) {
      return;
    }

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If there's an onSubmit callback (for use in other components), call it
      if (onSubmit) {
        onSubmit(generatedResume);
      }

      // Save the generated resume to the user's profile in Firebase
      const userDocRef = doc(db, 'users', user.uid);
      
      // Get current user data to check for existing resumes
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data() as UserData;
      
      // Create a new resume object
      const newResume = {
        id: Date.now().toString(),
        title: post ? `${post.title} Resume` : 'AI Generated Resume',
        content: generatedResume,
        createdAt: new Date().toISOString(),
        jobId: post?.id || null
      };
      
      // Update the user document with the new resume
      await updateDoc(userDocRef, {
        resumes: userData.resumes ? [...userData.resumes, newResume] : [newResume]
      });
      
      console.log('Resume saved to user profile');
    } catch (error) {
      console.error('Error saving resume to profile:', error);
      setError('Failed to save resume to your profile. Please try again.');
    } finally {
      // Close the modal if onClose is provided
      if (onClose) {
        onClose();
      } else {
        setShowModal(false);
      }
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-dark-lighter rounded-xl shadow-xl overflow-hidden animate-scaleIn">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Resume Generator
            </h2>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our AI will generate a professional resume tailored to the selected job post using your profile information. 
              This feature helps you create a targeted resume that highlights your relevant skills and experiences.
            </p>

            {post && (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 bg-gray-50 dark:bg-dark">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Selected Job</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Position:</span> {post.title}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Company:</span> {post.company}
                </p>
              </div>
            )}

            {userData && (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-dark">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Your Profile</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  <span className="font-medium">Name:</span> {userData.displayName || 'Not specified'}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  <span className="font-medium">Skills:</span> {Array.isArray(userData.skills) ? userData.skills.join(', ') : (userData.skills || 'Not specified')}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  <span className="font-medium">Education:</span> {Array.isArray(userData.education) ? userData.education.join(', ') : (userData.education || 'Not specified')}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  <span className="font-medium">Languages:</span> {Array.isArray(userData.languages) ? userData.languages.join(', ') : (userData.languages || 'Not specified')}
                </p>
                {/* Add more profile fields as needed */}
              </div>
            )}
          </div>

          {!generatedResume ? (
            <div className="flex justify-center">
              <button
                onClick={generateResume}
                disabled={loading || !userData || !post}
                className={`
                  inline-flex items-center px-6 py-3 rounded-xl text-white font-medium
                  transition-all duration-300
                  ${loading || !userData || !post 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-[1.02]'}
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Generate Resume
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-dark max-h-[300px] overflow-y-auto">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Generated Resume</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {generatedResume}
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                >
                  Use This Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResumeGenerator; 