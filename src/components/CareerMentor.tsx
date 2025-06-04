import React, { useState } from 'react';
import { useCareerMentor } from '../hooks/useCareerMentor';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';

const CareerMentor: React.FC = () => {
  const [input, setInput] = useState('');
  const [user] = useAuthState(auth);
  const { loading, response, askAI } = useCareerMentor();

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    await askAI(input, user.uid);
  };

  return (
    <div className="bg-white/10 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-white mb-2">🧠 Карьерный AI-наставник</h2>
      <p className="text-gray-300 mb-4">Задай вопрос об учебе, карьере, CV или откликах</p>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Например: Какую профессию выбрать, если мне нравится дизайн и психология?"
        className="w-full p-3 bg-white/5 rounded-md text-white mb-3"
        rows={3}
      />

      <button 
        onClick={handleSend} 
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition duration-300"
        disabled={loading || !input.trim()}
      >
        {loading ? 'Думаю...' : '🔍 Спросить у ИИ'}
      </button>

      {response && (
        <div className="mt-4 p-4 bg-white/5 rounded-md">
          <p className="text-white whitespace-pre-line">{response}</p>
        </div>
      )}
    </div>
  );
};

export default CareerMentor; 