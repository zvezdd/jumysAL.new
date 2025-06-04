import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, addDoc, collection, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Post } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import AIRecruitMatches from './AIRecruitMatches';
import { triggerCandidateMatching } from '../api/aiRecruit';
import CreateChat from './CreateChat';

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const postDoc = await getDoc(doc(db, 'posts', id));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
          
          // If the post has AI matching enabled and current user is the author,
          // trigger the candidate matching process
          const postData = postDoc.data();
          if (postData.aiMatching && user?.uid === postData.authorId) {
            triggerCandidateMatching(id);
          }
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError('Error fetching post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  const handleEdit = () => {
    navigate(`/posts/edit/${post?.id}`);
  };

  const handleDelete = async () => {
    if (!post?.id) return;
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
        navigate('/posts');
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleApply = async () => {
    console.log("Starting handleApply function");
    
    if (!user || !post) {
      console.error("Cannot apply: user or post is null", { userId: user?.uid, postId: post?.id });
      alert("Пожалуйста, войдите в систему, чтобы откликнуться на вакансию");
      return;
    }

    try {
      console.log("Fetching user data from Firestore");
      // Fetch user data including resume
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.error("User document does not exist in Firestore");
        alert("Пожалуйста, заполните свой профиль перед тем как откликаться на вакансии");
        navigate('/profile');
        return;
      }

      const userData = userDoc.data();
      console.log("User data fetched successfully", { hasData: !!userData });
      
      // Create initial message with resume data
      const resumeMessage = `
🎓 Отклик на вакансию "${post.title}"

${userData.displayName ? `👤 Имя: ${userData.displayName}` : ''}

${userData.education ? `📚 Образование:
${userData.education}` : ''}

${userData.skills ? `💪 Навыки:
${userData.skills.join(', ')}` : ''}

${userData.experience ? `💼 Опыт:
${userData.experience}` : ''}

${userData.achievements ? `🏆 Достижения:
${userData.achievements}` : ''}

${userData.languages?.length ? `🌐 Языки:
${userData.languages.join(', ')}` : ''}

${userData.portfolio ? `🔗 Портфолио:
${userData.portfolio}` : ''}
      `;

      // Create chat
      const chatData = {
        participants: [user.uid, post.authorId],
        postId: post.id,
        postTitle: post.title,
        createdAt: new Date(),
        lastMessage: resumeMessage,
        lastMessageTime: new Date(),
        status: 'pending',
        unreadCount: {
          [post.authorId as string]: 1,
          [user.uid]: 0
        }
      };
      
      const chatRef = await addDoc(collection(db, 'chats'), chatData);

      // Add initial message to chat
      await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
        text: resumeMessage,
        senderId: user.uid,
        timestamp: new Date(),
        type: 'application',
        read: false
      });

      // Create application record
      await setDoc(doc(db, `applications/${post.id}/responses/${user.uid}`), {
        userId: user.uid,
        postId: post.id,
        chatId: chatRef.id,
        status: 'pending',
        appliedAt: new Date(),
        resumeData: {
          education: userData.education,
          skills: userData.skills,
          experience: userData.experience,
          achievements: userData.achievements,
          languages: userData.languages,
          portfolio: userData.portfolio
        }
      });

      // Create notification for employer
      await addDoc(collection(db, 'notifications'), {
        userId: post.authorId,
        type: 'new_application',
        chatId: chatRef.id,
        postId: post.id,
        postTitle: post.title,
        applicantName: userData.displayName,
        read: false,
        timestamp: new Date()
      });

      // Show success message
      alert("Вы успешно откликнулись на вакансию! Сейчас вы будете перенаправлены в чат с работодателем.");
      
      try {
        // Проверим, что чат создан успешно
        const chatRefData = await getDoc(chatRef);
        if (!chatRefData.exists()) {
          console.error("Чат был создан, но документ не существует:", chatRef.id);
          alert("Произошла ошибка при создании чата. Пожалуйста, обратитесь в службу поддержки.");
          return;
        }
        
        console.log("Успешно создан чат с ID:", chatRef.id);
        console.log("Переходим к чату...");
        
        // Navigate to chat
        setTimeout(() => {
          navigate(`/chat/${chatRef.id}`);
        }, 500);
      } catch (err) {
        console.error("Ошибка при проверке созданного чата:", err);
        alert("Чат создан, но произошла ошибка при переходе. Пожалуйста, перейдите в раздел сообщений вручную.");
      }
      
    } catch (err) {
      console.error('Error applying:', err);
      alert("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
    }
  };

  // Check if current user is the employer (post author)
  const isEmployer = user?.uid === post?.authorId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
        <p className="ml-2 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-300">
        {error || 'Post not found'}
      </div>
    );
  }

  const formatDate = (date: any): string => {
    if (!date) return '';
    
    console.log("Formatting date object:", date);
    
    // Обработка Firebase Timestamp объекта
    if (typeof date === 'object' && date !== null && 'seconds' in date && typeof date.seconds === 'number') {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    
    // Стандартная обработка для Date или строки
    try {
      const postDate = date instanceof Date ? date : new Date(date);
      return postDate.toLocaleDateString();
    } catch (err) {
      console.error("Error formatting date:", date, err);
      return 'Invalid date';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-dark-lighter rounded-lg shadow-card p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
            <div className="flex items-center mt-2">
              {post.companyLogo ? (
                <img 
                  src={post.companyLogo} 
                  alt={post.companyName} 
                  className="w-10 h-10 rounded-full mr-2 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                  <span className="text-primary font-semibold">{post.companyName.charAt(0)}</span>
                </div>
              )}
              <span className="text-gray-600 dark:text-gray-300 font-medium">{post.companyName}</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400">Posted on {formatDate(post.postedDate)}</span>
            </div>
          </div>
          
          {isEmployer && (
            <div className="flex space-x-4">
              <button
                onClick={handleEdit}
                className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-md transition-colors"
              >
                {t('posts.editPost')}
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                {t('posts.delete')}
              </button>
            </div>
          )}
        </div>

        {/* If AI matching is enabled and current user is the employer, show the AI Recruit matches */}
        {post.aiMatching && isEmployer && (
          <AIRecruitMatches jobId={post.id} isEmployer={isEmployer} />
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">{post.location}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">{post.salary}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">{post.employmentType}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">{post.experienceLevel}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">{post.format}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">{post.status}</span>
          </div>
        </div>
        
        {/* Display AI matching badge if enabled */}
        {post.aiMatching && (
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-3 rounded-lg mb-6 flex items-center text-blue-400">
            <span className="mr-2">🤖</span>
            <span className="text-sm font-medium">AI-подбор кандидатов включен для этой вакансии</span>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('posts.description')}</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{post.description}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('posts.requirements')}</h2>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
            {post.requirements && post.requirements.length > 0 ? (
              post.requirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))
            ) : (
              <li>No specific requirements listed.</li>
            )}
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('posts.skills')}</h2>
          <div className="flex flex-wrap gap-2">
            {post.skills.map((skill, index) => (
              <span 
                key={index}
                className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {post.benefits && post.benefits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('posts.benefits')}</h2>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
              {post.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Matching criteria section */}
        {post.aiMatching && isEmployer && (
          <div className="mb-6 bg-gradient-to-r from-blue-900/10 to-purple-900/10 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-400 mb-3">Критерии AI-подбора</h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {post.skillsRequired && post.skillsRequired.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Обязательные навыки:</h3>
                  <div className="flex flex-wrap gap-1">
                    {post.skillsRequired.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {post.minExperience !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Мин. опыт:</h3>
                  <p className="text-gray-200">{post.minExperience} {post.minExperience === 1 ? 'год' : post.minExperience > 1 && post.minExperience < 5 ? 'года' : 'лет'}</p>
                </div>
              )}
              
              {post.preferredUniversities && post.preferredUniversities.length > 0 && (
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Приоритетные университеты:</h3>
                  <p className="text-gray-200">{post.preferredUniversities.join(', ')}</p>
                </div>
              )}
              
              {post.otherCriteria && (
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Дополнительные критерии:</h3>
                  <p className="text-gray-200">{post.otherCriteria}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← {t('common.back')}
            </button>
            
            {!isEmployer && user && post.userId && (
              <div className="mt-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <CreateChat 
                  recipientId={post.userId}
                  postId={id || ''}
                  postTitle={post.title || 'Вакансия'}
                  initiateButtonText="Откликнуться"
                  buttonClassName="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent"
                />
                
                <button
                  onClick={(e) => {
                    // Handle save functionality
                  }}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-dark-lighter hover:bg-gray-50 dark:hover:bg-dark-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Сохранить
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
