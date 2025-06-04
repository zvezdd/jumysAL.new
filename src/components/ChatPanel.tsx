import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { UserData } from '../types';

interface Chat {
  id: string;
  lastMessage: {
    text: string;
    timestamp: any;
  };
  unreadCount: {
    [key: string]: number;
  };
  otherUser: UserData;
}

const ChatPanel: React.FC = () => {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      try {
        // Get all chats where the current user is a participant
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid),
          orderBy('lastMessage.timestamp', 'desc')
        );

        const chatsSnapshot = await getDocs(chatsQuery);
        const chatsData: Chat[] = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            // Get the other user's data
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUserData = otherUserDoc.data() as UserData;

            chatsData.push({
              id: chatDoc.id,
              lastMessage: chatData.lastMessage,
              unreadCount: chatData.unreadCount || {},
              otherUser: otherUserData
            });
          }
        }

        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Chats</h1>
      
      {chats.length === 0 ? (
        <div className="text-center text-gray-400">
          No chats yet. Start a conversation with someone!
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={chat.otherUser.photoURL || 'https://via.placeholder.com/40'}
                    alt={chat.otherUser.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h2 className="text-white font-medium">{chat.otherUser.displayName}</h2>
                    <p className="text-gray-400 text-sm">
                      {chat.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {chat.lastMessage?.timestamp && (
                    <p className="text-gray-400 text-sm">
                      {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })}
                    </p>
                  )}
                  {chat.unreadCount[user?.uid || ''] > 0 && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                      {chat.unreadCount[user?.uid || '']}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPanel; 