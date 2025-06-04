import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy, doc, getDoc, Timestamp, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, getDb } from '../firebase';

interface ChatPreview {
  id: string;
  lastMessage: string;
  updatedAt: any;
  participants: string[];
  unreadCount: Record<string, number>;
  otherUserData?: {
    uid: string;
    displayName: string;
    photoURL: string;
    status?: string;
    role?: string;
  };
}

interface ChatContextType {
  chats: ChatPreview[];
  loading: boolean;
  error: string | null;
  totalUnreadCount: number;
  refreshChats: () => void;
}

const ChatContext = createContext<ChatContextType>({
  chats: [],
  loading: true,
  error: null,
  totalUnreadCount: 0,
  refreshChats: () => {}
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const fetchChats = async () => {
    if (!user || !user.uid) {
      console.log('Skipping fetchChats - no authenticated user');
      setChats([]);
      setLoading(false);
      setTotalUnreadCount(0);
      return;
    }

    console.log('Starting fetchChats for user:', user.uid);
    
    // Get Firestore instance safely
    let firestore;
    try {
      firestore = await getDb();
      console.log('Firestore instance retrieved successfully');
    } catch (dbError) {
      console.error('Failed to get Firestore instance:', dbError);
      setError('База данных не инициализирована. Пожалуйста, обновите страницу.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Query chats where the current user is a participant
      const chatsRef = collection(firestore, 'chats');
      
      try {
        // Проверяем сначала, существует ли коллекция
        const testQuery = query(chatsRef, limit(1));
        const testSnapshot = await getDocs(testQuery);
        console.log('Test query for chats collection:', testSnapshot.empty ? 'empty' : 'has data');
      } catch (testError) {
        console.error('Error testing chats collection:', testError);
        setError('Ошибка доступа к коллекции чатов');
        setLoading(false);
        return null;
      }

      // Создаем основной запрос после проверки
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );

      console.log('Chat query created, attaching snapshot listener');

      // Set up real-time listener
      let unsubscribe: (() => void) | null = null;
      try {
        unsubscribe = onSnapshot(q, (snapshot) => {
          try {
            if (snapshot.empty) {
              setChats([]);
              setTotalUnreadCount(0);
              setLoading(false);
              return;
            }

            const chatPromises = snapshot.docs.map(async (doc) => {
              try {
                const chatData = doc.data();
                
                // Make sure we have valid participants array
                if (!chatData.participants || !Array.isArray(chatData.participants)) {
                  console.warn('Chat document missing participants array:', doc.id);
                  return {
                    id: doc.id,
                    lastMessage: 'Ошибка данных',
                    updatedAt: { toDate: () => new Date() },
                    participants: [],
                    unreadCount: {},
                  };
                }
                
                // Find the other participant
                const otherUserId = chatData.participants.find(
                  (participantId: string) => participantId !== user.uid
                );
                
                // Get other user's data if available
                let otherUserData = undefined;
                
                if (otherUserId) {
                  try {
                    const userDocRef = doc(firestore, 'users', otherUserId);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                      const userData = userDocSnap.data();
                      otherUserData = {
                        uid: otherUserId,
                        displayName: userData.displayName || 'Пользователь',
                        photoURL: userData.photoURL || 'https://via.placeholder.com/40',
                        status: userData.status,
                        role: userData.role
                      };
                    }
                  } catch (err) {
                    console.error('Error fetching other user data:', err);
                  }
                }
                
                // Ensure updatedAt is valid
                let formattedUpdatedAt = chatData.updatedAt;
                if (!formattedUpdatedAt) {
                  formattedUpdatedAt = Timestamp.now();
                }
                
                return {
                  id: doc.id,
                  lastMessage: chatData.lastMessage || 'Нет сообщений',
                  updatedAt: formattedUpdatedAt,
                  participants: chatData.participants,
                  unreadCount: chatData.unreadCount || {},
                  otherUserData
                };
              } catch (err) {
                console.error('Error processing chat document:', err, 'Doc ID:', doc.id);
                // Return a minimal valid object to prevent the entire Promise.all from failing
                return {
                  id: doc.id,
                  lastMessage: 'Ошибка загрузки',
                  updatedAt: { toDate: () => new Date() },
                  participants: [],
                  unreadCount: {},
                };
              }
            });
            
            Promise.all(chatPromises)
              .then(chatsList => {
                try {
                  // Calculate total unread count
                  let total = 0;
                  chatsList.forEach(chat => {
                    if (chat.unreadCount && typeof chat.unreadCount[user.uid] === 'number') {
                      total += chat.unreadCount[user.uid];
                    }
                  });
                  
                  setTotalUnreadCount(total);

                  // Sort manually by updatedAt after fetching all chats
                  // This avoids Firestore index requirements
                  chatsList.sort((a, b) => {
                    try {
                      // Try to extract dates first
                      let dateA: Date;
                      let dateB: Date;
                      
                      if (a.updatedAt && typeof a.updatedAt.toDate === 'function') {
                        try {
                          dateA = a.updatedAt.toDate();
                        } catch {
                          dateA = new Date(0);
                        }
                      } else {
                        dateA = new Date(0);
                      }
                      
                      if (b.updatedAt && typeof b.updatedAt.toDate === 'function') {
                        try {
                          dateB = b.updatedAt.toDate();
                        } catch {
                          dateB = new Date(0);
                        }
                      } else {
                        dateB = new Date(0);
                      }
                      
                      // Sort newest first (descending)
                      return dateB.getTime() - dateA.getTime();
                    } catch (err) {
                      console.error('Error during chat sorting:', err);
                      return 0; // Keep original order if error
                    }
                  });
                  
                  setChats(chatsList);
                } catch (err) {
                  console.error('Error processing chat list:', err);
                  setError('Ошибка при обработке списка чатов');
                } finally {
                  setLoading(false);
                }
              })
              .catch(err => {
                console.error('Error resolving chat promises:', err);
                setError('Ошибка при загрузке чатов');
                setLoading(false);
              });
          } catch (err) {
            console.error('Critical error in chat snapshot handler:', err);
            setError('Не удалось загрузить чаты');
            setLoading(false);
          }
        }, (err) => {
          console.error('Error in chats snapshot:', err);
          setError('Ошибка при получении списка чатов');
          setChats([]);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (listenerError) {
        console.error('Failed to set up chat listener:', listenerError);
        setError('Не удалось установить соединение с базой данных. Пожалуйста, попробуйте позже.');
        setChats([]);
        setLoading(false);
        return null;
      }
    } catch (err) {
      console.error('Error setting up chats listener:', err);
      setError('Не удалось загрузить список чатов');
      setChats([]);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = fetchChats();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <ChatContext.Provider 
      value={{ 
        chats, 
        loading, 
        error, 
        totalUnreadCount,
        refreshChats: fetchChats
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 