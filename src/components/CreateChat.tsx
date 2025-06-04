import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

interface CreateChatProps {
  recipientId: string;
  postId?: string;
  postTitle?: string;
  initiateButtonText?: string;
  onChatCreated?: (chatId: string) => void;
  buttonClassName?: string;
}

const CreateChat: React.FC<CreateChatProps> = ({
  recipientId,
  postId,
  postTitle,
  initiateButtonText = 'Начать чат',
  onChatCreated,
  buttonClassName = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent"
}) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.uid === recipientId) {
      setError('Вы не можете создать чат с самим собой');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Creating chat with recipient:", recipientId);

      // Check if recipient exists
      const recipientDoc = await getDoc(doc(db, 'users', recipientId));
      if (!recipientDoc.exists()) {
        console.error("Recipient not found:", recipientId);
        throw new Error('Пользователь не найден');
      }
      console.log("Recipient found:", recipientDoc.data());

      // Check if a chat already exists between these users
      const existingChatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );

      const existingChatsSnapshot = await getDocs(existingChatsQuery);
      let existingChatId: string | null = null;

      existingChatsSnapshot.forEach(doc => {
        const chatData = doc.data();
        if (chatData.participants.includes(recipientId)) {
          existingChatId = doc.id;
          console.log("Found existing chat:", existingChatId);
        }
      });

      if (existingChatId) {
        // Chat already exists, navigate to it
        console.log("Navigating to existing chat:", existingChatId);
        if (onChatCreated) {
          onChatCreated(existingChatId);
        } else {
          navigate(`/chat/${existingChatId}`);
        }
        setLoading(false);
        return;
      }

      // Create a new chat
      console.log("Creating new chat between", user.uid, "and", recipientId);
      const chatData = {
        participants: [user.uid, recipientId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        unreadCount: {
          [user.uid]: 0,
          [recipientId]: 0
        }
      };

      // Add reference to post if applicable
      if (postId) {
        chatData.postId = postId;
        chatData.postTitle = postTitle || '';
        console.log("Adding post reference:", postId, postTitle);
      }

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      console.log("Chat created with ID:", chatRef.id);

      // If first message should be sent right away
      if (postId && postTitle) {
        const messageData = {
          text: `Здравствуйте! Я заинтересован(-а) в вакансии "${postTitle}"`,
          senderId: user.uid,
          createdAt: serverTimestamp(),
          status: 'sent',
          type: 'text'
        };

        console.log("Sending first message");
        const messageRef = await addDoc(
          collection(db, 'chats', chatRef.id, 'messages'), 
          messageData
        );
        console.log("First message sent with ID:", messageRef.id);

        // Update chat with the last message
        await updateDoc(doc(db, 'chats', chatRef.id), {
          lastMessage: messageData.text,
          updatedAt: serverTimestamp(),
          [`unreadCount.${recipientId}`]: 1
        });
        console.log("Chat document updated with last message");
      }

      setLoading(false);
      
      if (onChatCreated) {
        onChatCreated(chatRef.id);
      } else {
        console.log("Navigating to new chat:", chatRef.id);
        navigate(`/chat/${chatRef.id}`);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      let errorMessage = 'Не удалось создать чат. Пожалуйста, попробуйте позже.';
      
      if (err instanceof Error) {
        if (err.message === 'Пользователь не найден') {
          errorMessage = 'Пользователь не найден. Возможно, аккаунт был удален.';
        }
        // Add more specific error handling as needed
        console.error('Error details:', err.message);
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleCreateChat}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Создание...
          </>
        ) : (
          initiateButtonText
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </>
  );
};

export default CreateChat; 