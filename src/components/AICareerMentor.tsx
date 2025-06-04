import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { UserData } from '../types';
import { generateText } from '../api/gemini';

const AICareerMentor: React.FC = () => {
  const [user] = useAuthState(auth);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResponse('');

     
    try {
      // Build context from user data
      let userContext = '';
      
      if (userData) {
        userContext = `
User Profile Information:
- Name: ${userData.displayName || 'Not provided'}
- Role: ${userData.role || 'Not specified'}
- Level: ${userData.level || 'Not specified'}
- XP: ${userData.xp || 'Not specified'}
- Interests: ${userData.interests?.join(', ') || 'Not specified'}
- Skills: ${userData.skills?.join(', ') || 'Not specified'}
- Education: ${userData.education || 'Not specified'}
- Experience: ${userData.experience || 'Not specified'}
`;
      }
      
      const prompt = `You are an AI Career Mentor for teenagers. A student asked: "${question}"

${userContext}

Please provide a detailed response that includes:
1. Important skills needed for this career path
2. Recommended learning resources and platforms
3. Types of internships or entry-level positions that would be good starting points
4. Potential career growth opportunities

Keep the tone friendly and encouraging. Format your response with clear sections and bullet points where appropriate.`;

      // Use the centralized generateText function
      const result = await generateText(prompt, 'career advisor');
      
      if (result.success && result.data) {
        setResponse(result.data);
        
        // Save the conversation to history if user is logged in
        if (user) {
          await addDoc(collection(db, 'careerMentorHistory'), {
            uid: user.uid,
            question,
            response: result.data,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        throw new Error(result.error || 'Failed to get response from AI');
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      setError(error.message || 'An error occurred while getting the AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black px-4 relative overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="max-w-4xl w-full bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-10 relative z-10 border border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          AI Career Mentor
        </h2>
        
        <div className="mb-10">
          <label htmlFor="question" className="block text-gray-300 text-lg mb-3">
            Ask me anything about career paths, skills, or job opportunities
          </label>
          <div className="relative">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What skills do I need to become a software developer?"
              className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="absolute right-4 bottom-4 bg-gradient-to-r from-primary to-accent text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {response && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 animate-fadeInUp">
            <h3 className="text-xl font-semibold text-primary mb-4">Your Career Advice</h3>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-line text-gray-300">
                {response}
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Powered by advanced AI to help you navigate your career journey.</p>
        </div>
      </div>
    </div>
  );
};

export default AICareerMentor; 