import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useChat } from '../context/ChatContext';

const ChatNotifications: React.FC = () => {
  const [user] = useAuthState(auth);
  const { totalUnreadCount, loading } = useChat();

  if (loading || !user) {
    return null;
  }

  return (
    <Link to="/chats" className="relative inline-block">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-colors" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      
      {totalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary dark:bg-accent text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
        </span>
      )}
    </Link>
  );
};

export default ChatNotifications; 