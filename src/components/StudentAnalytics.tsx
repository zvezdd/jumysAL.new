import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface ProfileView {
  viewerUserId: string;
  timestamp: number;
  viewerName?: string;
}

interface Analytics {
  applications: number;
  profileViews: ProfileView[];
}

export const StudentAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    applications: 0,
    profileViews: []
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      // Получаем количество откликов (чатов)
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      
      // Получаем просмотры профиля
      const viewsQuery = query(
        collection(db, 'profileViews'),
        where('viewedUserId', '==', user.uid)
      );

      // Подписываемся на изменения просмотров профиля
      const unsubscribe = onSnapshot(viewsQuery, async (snapshot) => {
        const views: ProfileView[] = [];
        
        for (const doc of snapshot.docs) {
          const view = doc.data() as ProfileView;
          // Получаем имя просмотревшего
          const userDoc = await getDocs(query(
            collection(db, 'users'),
            where('uid', '==', view.viewerUserId)
          ));
          if (!userDoc.empty) {
            view.viewerName = userDoc.docs[0].data().name;
          }
          views.push(view);
        }

        setAnalytics({
          applications: chatsSnapshot.size,
          profileViews: views.sort((a, b) => b.timestamp - a.timestamp)
        });
      });

      return () => unsubscribe();
    };

    fetchAnalytics();
  }, [user]);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white/5 p-6 rounded-xl backdrop-blur-md shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">📊 Your Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">✉️ Applications Sent</h3>
          <p className="text-3xl font-bold text-white">{analytics.applications}</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">🔍 Profile Views</h3>
          <p className="text-3xl font-bold text-white">{analytics.profileViews.length}</p>
        </div>
      </div>
      
      {analytics.profileViews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Profile Views</h3>
          <div className="space-y-2">
            {analytics.profileViews.slice(0, 5).map((view, index) => (
              <div key={index} className="bg-white/10 p-3 rounded-lg">
                <p className="text-white">
                  {view.viewerName || 'Anonymous'} viewed your profile{' '}
                  <span className="text-gray-400">{formatTimeAgo(view.timestamp)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 