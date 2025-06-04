import { useState } from 'react';
import { buildCareerPrompt } from '../utils/careerPromptBuilder';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';

export const useCareerMentor = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const getUserData = async (uid: string): Promise<UserData> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return {} as UserData;
  };

  const askAI = async (question: string, uid: string) => {
    try {
      setLoading(true);
      const userData = await getUserData(uid);
      const prompt = buildCareerPrompt(userData, question);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setResponse('Извините, произошла ошибка. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return { loading, response, askAI };
}; 