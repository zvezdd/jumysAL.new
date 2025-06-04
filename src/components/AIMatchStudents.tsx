import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Post, UserData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AIMatchStudentsProps {
  post: Post;
  onClose: () => void;
}

const AIMatchStudents: React.FC<AIMatchStudentsProps> = ({ post, onClose }) => {
  const [user] = useAuthState(auth);
  const [matchedStudents, setMatchedStudents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchMatchedStudents = async () => {
      if (!user || !post) return;

      try {
        // Get all students
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student')
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const students = studentsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserData))
          .filter(student => {
            // Filter by grade range if it exists
            const studentGrade = student.grade || 0;
            if (!post.gradeRange) return true; // If no grade range is specified, include all students
            return studentGrade >= post.gradeRange.min && studentGrade <= post.gradeRange.max;
          });

        // Sort by match score
        const sortedStudents = students.sort((a, b) => {
          const scoreA = calculateMatchScore(a, post);
          const scoreB = calculateMatchScore(b, post);
          return scoreB - scoreA;
        });

        setMatchedStudents(sortedStudents);
      } catch (err) {
        console.error('Error fetching matched students:', err);
        setError('Error fetching matched students');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedStudents();
  }, [user, post]);

  const calculateMatchScore = (student: UserData, post: Post): number => {
    let score = 0;

    // Match by skills
    if (student.skills && post.requiredSkills) {
      const matchingSkills = student.skills.filter(skill => 
        post.requiredSkills.includes(skill)
      );
      score += matchingSkills.length * 10;
    }

    // Match by experience
    if (student.experience && post.requirements) {
      const hasRelevantExperience = student.experience.toLowerCase().includes(
        post.requirements.toLowerCase()
      );
      if (hasRelevantExperience) score += 20;
    }

    // Match by education
    if (student.education && post.requirements) {
      const hasRelevantEducation = student.education.toLowerCase().includes(
        post.requirements.toLowerCase()
      );
      if (hasRelevantEducation) score += 15;
    }

    return score;
  };

  const handleContact = async (student: UserData) => {
    if (!user || !student) return;

    try {
      // Create chat
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, student.uid],
        postId: post.id,
        createdAt: new Date(),
        lastMessage: null,
        unreadCount: {
          [student.uid]: 1
        }
      });

      // Add initial message
      await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
        text: `Interested in your profile for ${post.title}`,
        senderId: user.uid,
        timestamp: new Date(),
        read: false
      });

      // Navigate to chat
      window.location.href = `/chat/${chatRef.id}`;
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Error creating chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        {error}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t('aiMatch.matchedStudents')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {post.gradeRange && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Grade Range:</span>
            <span className="text-white">
              {post.gradeRange.min} - {post.gradeRange.max}
            </span>
          </div>
        )}

        {matchedStudents.length === 0 ? (
          <p className="text-gray-300 text-center py-8">
            {t('aiMatch.noMatches')}
          </p>
        ) : (
          <div className="space-y-4">
            {matchedStudents.map(student => (
              <div
                key={student.uid}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {student.displayName}
                    </h3>
                    {student.education && (
                      <p className="text-gray-300 mt-1">
                        {student.education}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleContact(student)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('aiMatch.contact')}
                  </button>
                </div>
                {student.skills && student.skills.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      {t('aiMatch.skills')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {student.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMatchStudents; 