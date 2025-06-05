import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy, doc, getDoc, Timestamp, limit, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, getDb } from '../firebase';

interface UserData {
  displayName?: string;
  photoURL?: string;
  status?: string;
  role?: string;
}

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
  refreshChats: () => Promise<(() => void) | null>;
}

const ChatContext = createContext<ChatContextType>({
  chats: [],
  loading: true,
  error: null,
  totalUnreadCount: 0,
  refreshChats: async () => null, // Return null to match Promise<(() => void) | null>
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const fetchChats = async (): Promise<(() => void) | null> => {
    if (!user || !user.uid) {
      console.log('Skipping fetchChats - no authenticated user');
      setChats([]);
      setLoading(false);
      setTotalUnreadCount(0);
      return null;
    }

    console.log('Starting fetchChats for user:', user.uid);

    let firestore;
    try {
      firestore = await getDb();
      console.log('Firestore instance retrieved successfully');
    } catch (dbError) {
      console.error('Failed to get Firestore instance:', dbError);
      setError('База данных не инициализирована. Пожалуйста, обновите страницу.');
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const chatsRef = collection(firestore, 'chats');

      try {
        const testQuery = query(chatsRef, limit(1));
        const testSnapshot = await getDocs(testQuery);
        console.log('Test query for chats collection:', testSnapshot.empty ? 'empty' : 'has data');
      } catch (testError) {
        console.error('Error testing chats collection:', testError);
        setError('Ошибка доступа к коллекции чатов');
        setLoading(false);
        return;
      }

      const q = query(chatsRef, where('participants', 'array-contains', user.uid));

      console.log('Chat query created, attaching snapshot listener');

      // Remove previous listener if any
      if ((window as any).__chatUnsubscribe) {
        try {
          (window as any).__chatUnsubscribe();
        } catch {}
      }

      let unsubscribe: (() => void) | null = null;
      try {
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            try {
              if (snapshot.empty) {
                setChats([]);
                setTotalUnreadCount(0);
                setLoading(false);
                return;
              }

              const chatPromises = snapshot.docs.map(async (chatDoc: QueryDocumentSnapshot<DocumentData>) => {
                try {
                  const chatData = chatDoc.data();

                  if (!chatData.participants || !Array.isArray(chatData.participants)) {
                    console.warn('Chat document missing participants array:', chatDoc.id);
                    return {
                      id: chatDoc.id,
                      lastMessage: 'Ошибка данных',
                      updatedAt: { toDate: () => new Date() },
                      participants: [],
                      unreadCount: {},
                    };
                  }

                  const otherUserId = chatData.participants.find(
                    (participantId: string) => participantId !== user.uid
                  );

                  let otherUserData = undefined;

                  if (otherUserId) {
                    try {
                      const userDocRef = doc(firestore, 'users', otherUserId);
                      const userDocSnap = await getDoc(userDocRef);
                      

                      if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserData;
                        
                        otherUserData = {
                          uid: otherUserId,
                          displayName: userData.displayName || 'Пользователь',
                          photoURL: userData.photoURL || 'https://via.placeholder.com/40',
                          status: userData.status,
                          role: userData.role,
                        };
                      }
                    } catch (err) {
                      console.error('Error fetching other user data:', err);
                    }
                  }

                  let formattedUpdatedAt = chatData.updatedAt;
                  if (!formattedUpdatedAt) {
                    formattedUpdatedAt = Timestamp.now();
                  }

                  return {
                    id: chatDoc.id,
                    lastMessage: chatData.lastMessage || 'Нет сообщений',
                    updatedAt: formattedUpdatedAt,
                    participants: chatData.participants,
                    unreadCount: chatData.unreadCount || {},
                    otherUserData,
                  };
                } catch (err) {
                  console.error('Error processing chat document:', err, 'Doc ID:', chatDoc.id);
                  return {
                    id: chatDoc.id,
                    lastMessage: 'Ошибка загрузки',
                    updatedAt: { toDate: () => new Date() },
                    participants: [],
                    unreadCount: {},
                  };
                }
              });

              Promise.all(chatPromises)
                .then((chatsList) => {
                  try {
                    let total = 0;
                    chatsList.forEach((chat) => {
                      if (chat.unreadCount && typeof chat.unreadCount[user.uid] === 'number') {
                        total += chat.unreadCount[user.uid];
                      }
                    });

                    setTotalUnreadCount(total);

                    chatsList.sort((a, b) => {
                      try {
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

                        return dateB.getTime() - dateA.getTime();
                      } catch (err) {
                        console.error('Error during chat sorting:', err);
                        return 0;
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
                .catch((err) => {
                  console.error('Error resolving chat promises:', err);
                  setError('Ошибка при загрузке чатов');
                  setLoading(false);
                });
            } catch (err) {
              console.error('Critical error in chat snapshot handler:', err);
              setError('Не удалось загрузить чаты');
              setLoading(false);
            }
          },
          (err) => {
            console.error('Error in chats snapshot:', err);
            setError('Ошибка при получении списка чатов');
            setChats([]);
            setLoading(false);
          }
        );

        // Save unsubscribe function globally to remove it on next call
        (window as any).__chatUnsubscribe = unsubscribe;
      } catch (listenerError) {
        console.error('Failed to set up chat listener:', listenerError);
        setError('Не удалось установить соединение с базой данных. Пожалуйста, попробуйте позже.');
        setChats([]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error setting up chats listener:', err);
      setError('Не удалось загрузить список чатов');
      setChats([]);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initChats = async () => {
      unsubscribe = await fetchChats();
    };

    initChats();

    return () => {
      if (unsubscribe) {
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
        refreshChats: fetchChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;