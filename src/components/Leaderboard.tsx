import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { LEVELS } from '../utils/points';

interface LeaderboardUser {
  id: string;
  displayName: string;
  points: number;
  level: number;
  totalXp: number;
}

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('points', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leaderboardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardUser[];
      
      setLeaders(leaderboardData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getLevelInfo = (level: number) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-6 shadow-lg backdrop-blur-md animate-pulse">
        <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <span className="mr-2">🏆</span> Топ-10 студентов
      </h2>
      <ol className="space-y-3">
        {leaders.map((user, index) => {
          const levelInfo = getLevelInfo(user.level);
          return (
            <li 
              key={user.id} 
              className={`flex justify-between items-center p-3 rounded-lg transition-all
                ${index === 0 ? 'bg-yellow-500/20' : 
                  index === 1 ? 'bg-gray-400/20' : 
                  index === 2 ? 'bg-amber-700/20' : 
                  'bg-white/5'}`}
            >
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-amber-600' :
                  'text-white'
                }`}>
                  #{index + 1}
                </span>
                <div>
                  <div className="text-white font-medium">{user.displayName}</div>
                  <div className="text-sm text-gray-400">
                    Уровень {user.level} - {levelInfo.title}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-purple-300 font-semibold">{user.points} pts</div>
                <div className="text-sm text-gray-400">{user.totalXp} XP</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Leaderboard; 