import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Analytics {
  views: number;
  replies: number;
  conversion: number;
}

export const BusinessAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    views: 0,
    replies: 0,
    conversion: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      // Получаем все посты бизнеса
      const postsQuery = query(
        collection(db, 'posts'),
        where('businessId', '==', user.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      let totalViews = 0;
      let totalReplies = 0;

      // Для каждого поста получаем просмотры и отклики
      for (const postDoc of postsSnapshot.docs) {
        const post = postDoc.data();
        totalViews += post.views || 0;

        // Получаем количество чатов для этого поста
        const chatsQuery = query(
          collection(db, 'chats'),
          where('postId', '==', postDoc.id)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        totalReplies += chatsSnapshot.size;
      }

      // Вычисляем конверсию
      const conversion = totalViews > 0 ? (totalReplies / totalViews) * 100 : 0;

      setAnalytics({
        views: totalViews,
        replies: totalReplies,
        conversion: Number(conversion.toFixed(1))
      });
    };

    fetchAnalytics();
  }, [user]);

  return (
    <div className="bg-white/5 p-6 rounded-xl backdrop-blur-md shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">📊 Business Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">👀 Views</h3>
          <p className="text-3xl font-bold text-white">{analytics.views}</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">💬 Replies</h3>
          <p className="text-3xl font-bold text-white">{analytics.replies}</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">📈 Conversion</h3>
          <p className="text-3xl font-bold text-white">{analytics.conversion}%</p>
        </div>
      </div>
    </div>
  );
}; 