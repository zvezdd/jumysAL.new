import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { Message, UserData } from '../types';

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Add logging effect for debugging
  useEffect(() => {
    console.log("Chat component mounted with chat ID:", id);
    console.log("Current user:", user);
    
    // Basic validation
    if (!id) {
      setError("Invalid chat ID: Chat cannot be loaded");
      setLoading(false);
      return;
    }
    
    if (!user) {
      setError("You must be logged in to view this chat");
      setLoading(false);
      return;
    }

    return () => {
      console.log("Chat component unmounted");
    };
  }, [id, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [messages]);

  // Main effect for loading chat data and setting up listeners
  useEffect(() => {
    if (!id || !user) return;

    console.log("Starting chat data fetch for chat ID:", id);
    console.log("Current user UID:", user.uid);

    const fetchChatData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Attempting to fetch chat document for ID:", id);
        
        // Get chat document
        const chatDoc = await getDoc(doc(db, 'chats', id));
        if (!chatDoc.exists()) {
          console.error('Chat not found:', id);
          setError('Чат не найден. Возможно, он был удален или у вас нет к нему доступа.');
          setLoading(false);
          return;
        }

        const chatData = chatDoc.data();
        console.log('Chat data loaded:', JSON.stringify(chatData, null, 2)); // Detailed debug log
        
        // Validate chat data
        if (!chatData || !chatData.participants || !Array.isArray(chatData.participants)) {
          console.error('Invalid chat data format:', chatData);
          setError('Неверный формат данных чата. Пожалуйста, обратитесь в службу поддержки.');
          setLoading(false);
          return;
        }

        // Verify current user is a participant
        if (!chatData.participants.includes(user.uid)) {
          console.error('User is not a participant in this chat:', user.uid);
          setError('У вас нет доступа к этому чату.');
          setLoading(false);
          return;
        }
        
        const otherUserId = chatData.participants.find(
          (participantId: string) => participantId !== user.uid
        );

        // Get other user's data
        if (otherUserId) {
          try {
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
              const userData = {
                ...otherUserDoc.data() as UserData,
                uid: otherUserDoc.id
              };
              console.log('Other user data loaded:', userData);
              setOtherUser(userData);
            } else {
              console.warn('Other user not found:', otherUserId);
            }
          } catch (userError) {
            console.error('Error fetching other user:', userError);
            // Continue with chat even if we can't get the other user's data
          }
        }

        // Mark unread messages as read
        try {
          await updateUnreadMessages();
        } catch (updateError) {
          console.error('Error updating unread messages:', updateError);
          // Continue even if we can't update unread status
        }

        // Listen for messages
        const messagesQuery = query(
          collection(db, 'chats', id, 'messages'),
          orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          try {
            const messagesList: Message[] = [];
            snapshot.forEach((doc) => {
              const messageData = doc.data();
              console.log('Message data:', messageData); // Log each message for debugging
              
              messagesList.push({
                id: doc.id,
                text: messageData.text || '',
                senderId: messageData.senderId,
                timestamp: messageData.createdAt,
                createdAt: messageData.createdAt,
                read: messageData.status === 'read',
                fileUrl: messageData.fileUrl,
                fileType: messageData.type === 'file' ? messageData.meta?.fileType : undefined
              });
            });
            
            console.log("Loaded messages:", messagesList); // Log messages for debugging
            
            setMessages(messagesList);
            setLoading(false);
            setInitialized(true);
            
            // Mark newly received messages as read
            if (messagesList.length > 0) {
              const unreadMessages = messagesList.filter(
                msg => msg.senderId !== user.uid && !msg.read
              );
              if (unreadMessages.length > 0) {
                markMessagesAsRead(unreadMessages.map(msg => msg.id))
                  .catch(err => console.error('Error marking messages as read:', err));
              }
            }
          } catch (messagesError) {
            console.error('Error processing messages:', messagesError);
            setError('Ошибка при обработке сообщений');
            setLoading(false);
          }
        }, (error) => {
          console.error('Error in messages snapshot:', error);
          setError('Ошибка при получении сообщений');
          setLoading(false);
        });

        // Listen for typing indicator
        let typingUnsubscribe = () => {};
        
        try {
          if (otherUserId) {
            const typingRef = doc(db, `chats/${id}/typing/${otherUserId}`);
            typingUnsubscribe = onSnapshot(typingRef, (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                const isCurrentlyTyping = data.isTyping;
                const lastUpdated = data.updatedAt?.toDate() || new Date();
                const fiveSecondsAgo = new Date(Date.now() - 5000);
                
                setIsTyping(isCurrentlyTyping && lastUpdated > fiveSecondsAgo);
              } else {
                setIsTyping(false);
              }
            }, (error) => {
              console.error('Error in typing indicator:', error);
              // Don't fail the whole chat for typing indicator issues
              setIsTyping(false);
            });
          }
        } catch (typingError) {
          console.error('Error setting up typing indicator:', typingError);
          // Continue without typing indicator
        }

        return () => {
          unsubscribe();
          typingUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Ошибка при загрузке чата. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [id, user]);

  // Handle typing indicator
  useEffect(() => {
    if (!id || !user || newMessage.length === 0) return;

    const updateTypingStatus = async () => {
      try {
        const typingRef = doc(db, `chats/${id}/typing/${user.uid}`);
        await updateDoc(typingRef, {
          isTyping: true,
          updatedAt: serverTimestamp()
        });

        // Clear typing status after 5 seconds of inactivity
        const timeout = setTimeout(async () => {
          await updateDoc(typingRef, {
            isTyping: false,
            updatedAt: serverTimestamp()
          });
        }, 5000);

        return () => clearTimeout(timeout);
      } catch (error) {
        console.error('Error updating typing status:', error);
      }
    };

    updateTypingStatus();
  }, [id, user, newMessage]);

  // Update unread message count
  const updateUnreadMessages = async () => {
    if (!id || !user) return;

    try {
      // Update chat document to set unread count to 0 for current user
      const chatRef = doc(db, 'chats', id);
      await updateDoc(chatRef, {
        [`unreadCount.${user.uid}`]: 0
      });
    } catch (error) {
      console.error('Error updating unread messages:', error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!id || !user || messageIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      
      messageIds.forEach(msgId => {
        const msgRef = doc(db, `chats/${id}/messages/${msgId}`);
        batch.update(msgRef, { status: 'read' });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || !user || !id) return;

    try {
      let fileUrl = '';
      let fileType = '';
      let fileName = '';
      let fileSize = 0;

      // Upload file if exists
      if (file) {
        setIsUploading(true);
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        
        const storageRef = ref(storage, `chat_files/${id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            setIsUploading(false);
          },
          async () => {
            fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await sendMessageToFirestore(fileUrl, fileType, fileName, fileSize);
            setFile(null);
            setUploadProgress(0);
            setIsUploading(false);
          }
        );
      } else {
        await sendMessageToFirestore();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add message to Firestore
  const sendMessageToFirestore = async (
    fileUrl: string = '',
    fileType: string = '',
    fileName: string = '',
    fileSize: number = 0
  ) => {
    if (!user || !id) return;

    const otherUserId = otherUser?.uid;
    const now = serverTimestamp();
    const messageType = fileUrl ? 'file' : 'text';
    
    // Create message object
    const messageData: any = {
      text: newMessage.trim(),
      senderId: user.uid,
      createdAt: now,
      status: 'sent',
      type: messageType,
    };

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.meta = {
        fileName,
        fileSize,
        fileType
      };
    }

    // Add message to subcollection
    await addDoc(
      collection(db, 'chats', id, 'messages'),
      messageData
    );

    // Update the chat document with last message info
    await updateDoc(doc(db, 'chats', id), {
      lastMessage: fileUrl ? 'Файл: ' + fileName : newMessage.trim(),
      updatedAt: now,
      // Increment unread count for the other user
      [`unreadCount.${otherUserId}`]: arrayUnion(1)
    });

    setNewMessage('');
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-accent"></div>
        <div className="ml-2">Загрузка чата...</div>
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
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 mt-16">
      <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 h-[80vh] flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <img
              src={otherUser?.photoURL || 'https://via.placeholder.com/40'}
              alt={otherUser?.displayName || 'User'}
              className="w-10 h-10 rounded-full mr-4"
            />
            {otherUser?.status === 'online' && (
              <span className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </div>
          <div>
            <h2 className="font-medium text-lg">{otherUser?.displayName || 'Пользователь'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {otherUser?.role === 'business' ? 'Работодатель' : 'Студент'}
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 my-8">
              Нет сообщений. Начните беседу!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === user?.uid
                      ? 'bg-primary text-white dark:bg-accent'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  {message.fileUrl && (
                    <div className="mb-2">
                      {message.fileType?.startsWith('image/') ? (
                        <img
                          src={message.fileUrl}
                          alt="Image"
                          className="max-w-full rounded"
                        />
                      ) : (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 dark:text-blue-300 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Скачать файл
                        </a>
                      )}
                    </div>
                  )}
                  
                  {message.text && <p>{message.text}</p>}
                  
                  <div className={`text-xs mt-1 ${
                    message.senderId === user?.uid
                      ? 'text-blue-100 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.createdAt ? (
                      formatDistanceToNow(
                        message.createdAt && typeof message.createdAt === 'object' && 'toDate' in message.createdAt && typeof message.createdAt.toDate === 'function'
                          ? message.createdAt.toDate()
                          : new Date()
                        , { addSuffix: true }
                      )
                    ) : 'сейчас'}
                    {message.senderId === user?.uid && (
                      <span className="ml-2">
                        {message.read ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="px-4 py-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Загрузка файла: {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {/* File Preview */}
        {file && !isUploading && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              type="button"
              onClick={triggerFileInput}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-gray-900 dark:text-white"
              placeholder="Напишите сообщение..."
              disabled={isUploading}
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !file) || isUploading}
              className="bg-primary hover:bg-primary-dark text-white dark:bg-accent dark:hover:bg-accent-dark px-4 py-2 rounded-r-lg disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
