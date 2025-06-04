import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { useChat } from '../context/ChatContext';

const ChatList: React.FC = () => {
  const [user] = useAuthState(auth);
  const { chats, loading, error, refreshChats } = useChat();

  // Debug logging
  useEffect(() => {
    console.log('ChatList rendered with state:', { 
      userExists: !!user, 
      chatsCount: chats.length, 
      isLoading: loading, 
      error 
    });
    
    if (error) {
      console.error('Chat error details:', error);
    }
  }, [user, chats, loading, error]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 mt-16">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-4 mt-16">
        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={refreshChats}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl p-4 mt-16">
        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Нет активных чатов</h2>
          <p className="text-gray-600 dark:text-gray-400">
            У вас пока нет активных чатов. Откликнитесь на вакансию или свяжитесь с кандидатом, чтобы начать общение.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 mt-16">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Сообщения</h1>
      
      <div className="space-y-4">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            to={`/chat/${chat.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4"
          >
            <div className="flex items-center">
              <div className="relative">
                <img
                  src={chat.otherUserData?.photoURL || 'https://via.placeholder.com/40'}
                  alt={chat.otherUserData?.displayName || 'User'}
                  className="w-12 h-12 rounded-full mr-4"
                />
                {chat.otherUserData?.status === 'online' && (
                  <span className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {chat.otherUserData?.displayName || 'Пользователь'}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {chat.updatedAt ? (
                      formatDistanceToNow(
                        typeof chat.updatedAt.toDate === 'function'
                          ? chat.updatedAt.toDate()
                          : new Date()
                        , { addSuffix: true }
                      )
                    ) : 'недавно'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[80%]">
                    {chat.lastMessage}
                  </p>
                  
                  {chat.unreadCount && chat.unreadCount[user?.uid || ''] > 0 && (
                    <span className="bg-primary dark:bg-accent text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                      {chat.unreadCount[user?.uid || '']}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatList; 