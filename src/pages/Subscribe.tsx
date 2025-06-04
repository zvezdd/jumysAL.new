import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Subscribe: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        premium: true,
        updatedAt: new Date()
      });
      navigate('/profile');
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">JumysAl+ Premium</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white/10 p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">Бесплатный план</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Просмотр вакансий
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Отклики на вакансии
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Базовый профиль
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="bg-purple-900/50 p-6 rounded-xl border-2 border-purple-500">
            <h2 className="text-2xl font-bold mb-4">JumysAl+ Premium</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Все функции бесплатного плана
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                AI Карьерный наставник
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Персональные рекомендации
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Помощь с составлением CV
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Генерация откликов на вакансии
              </li>
            </ul>
            <button
              onClick={handleSubscribe}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition duration-300"
            >
              Активировать Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe; 