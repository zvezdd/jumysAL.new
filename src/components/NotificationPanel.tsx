import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  userId: string;
  type: string;
  chatId: string;
  postId: string;
  postTitle: string;
  applicantName: string;
  read: boolean;
  timestamp: any;
}

const NotificationPanel: React.FC = () => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Query notifications for the current user
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });
    
    return () => unsubscribe();
  }, [user]);

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_application':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'new_application':
        return `${notification.applicantName} applied for "${notification.postTitle}"`;
      default:
        return 'New notification';
    }
  };

  return (
    <div className={`fixed top-0 right-0 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-12'}`}>
      <div className="bg-[#1a1a1a] rounded-bl-xl shadow-2xl overflow-hidden">
        <div 
          className="flex items-center justify-between p-3 bg-orange-500 cursor-pointer"
          onClick={togglePanel}
        >
          <h3 className="text-white font-bold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-white text-orange-500 rounded-full px-2 py-1 text-xs font-bold">
              {unreadCount}
            </span>
          )}
          <button className="text-white">
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <div className="p-2 border-b border-gray-700">
                    <button 
                      onClick={markAllAsRead}
                      className="w-full text-center text-xs text-orange-400 hover:text-orange-300"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <Link 
                      key={notification.id} 
                      to={`/chat/${notification.chatId}`}
                      className={`block p-3 hover:bg-gray-800 transition-colors ${!notification.read ? 'bg-gray-800/50' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{getNotificationText(notification)}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp?.toDate ? new Date(notification.timestamp.toDate()).toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel; 