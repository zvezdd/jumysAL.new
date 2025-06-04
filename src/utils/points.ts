import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PointsAction {
  type: 'registration' | 'apply' | 'chat' | 'complete_work' | 'profile_like' | 'profile_update' | 'save_post';
  points: number;
  xp: number;
  dailyLimit?: number;
}

export const POINTS_CONFIG: Record<PointsAction['type'], PointsAction> = {
  registration: { type: 'registration', points: 20, xp: 20 },
  apply: { type: 'apply', points: 10, xp: 15 },
  chat: { type: 'chat', points: 1, xp: 1, dailyLimit: 10 },
  complete_work: { type: 'complete_work', points: 40, xp: 50 },
  profile_like: { type: 'profile_like', points: 5, xp: 5 },
  profile_update: { type: 'profile_update', points: 2, xp: 3, dailyLimit: 1 },
  save_post: { type: 'save_post', points: 1, xp: 1 }
};

export const LEVELS = [
  { level: 1, xpRequired: 50, title: 'Новичок', color: 'gray' },
  { level: 2, xpRequired: 100, title: 'Исследователь', color: 'blue' },
  { level: 3, xpRequired: 200, title: 'Активист', color: 'indigo' },
  { level: 4, xpRequired: 300, title: 'Профи', color: 'purple' },
  { level: 5, xpRequired: 400, title: 'Легенда JumysAl', color: 'gold' }
];

export const addPoints = async (uid: string, actionType: PointsAction['type']) => {
  const action = POINTS_CONFIG[actionType];
  const userRef = doc(db, 'users', uid);
  
  try {
    // Проверяем дневной лимит, если он есть
    if (action.dailyLimit) {
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const today = new Date().toDateString();
      
      if (userData?.lastEarned?.[actionType]?.date === today) {
        if (userData.lastEarned[actionType].count >= action.dailyLimit) {
          return { success: false, message: 'Достигнут дневной лимит' };
        }
      }
    }

    // Обновляем баллы и XP
    await updateDoc(userRef, {
      points: increment(action.points),
      totalXp: increment(action.xp),
      [`lastEarned.${actionType}`]: {
        date: new Date().toDateString(),
        time: Date.now(),
        points: action.points,
        count: increment(1)
      }
    });

    // Проверяем повышение уровня
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const currentLevel = userData?.level || 1;
    const totalXp = (userData?.totalXp || 0) + action.xp;
    
    const newLevel = LEVELS.find(level => totalXp >= level.xpRequired)?.level || currentLevel;
    
    if (newLevel > currentLevel) {
      await updateDoc(userRef, {
        level: newLevel,
        levelUpDate: Date.now()
      });
    }

    return { 
      success: true, 
      points: action.points,
      xp: action.xp,
      levelUp: newLevel > currentLevel
    };
  } catch (error) {
    console.error('Error adding points:', error);
    return { success: false, message: 'Ошибка при начислении баллов' };
  }
}; 