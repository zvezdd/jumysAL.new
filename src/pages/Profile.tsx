import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          setFormData({
            displayName: data.displayName,
            interests: data.interests,
            skills: data.skills,
            education: data.education,
            experience: data.experience,
            // Add these properties only if they exist in the data
            ...(data.age !== undefined && { age: data.age }),
            ...(data.field !== undefined && { field: data.field })
          });
        }
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'interests' || name === 'skills') {
      setFormData({
        ...formData,
        [name]: value.split(',').map(item => item.trim())
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaveLoading(true);
    setSaveSuccess(false);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date()
      });
      
      setUserData({
        ...userData!,
        ...formData
      });
      
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-700">
                {userData?.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold">
                  {userData?.displayName || 'Пользователь'}
                </h1>
                <p className="text-gray-300">{user.email}</p>
                <div className="mt-2 flex items-center">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {userData?.role === 'student' ? 'Студент' : 'Работодатель'}
                  </span>
                  {userData?.premium && (
                    <span className="ml-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {saveSuccess && (
              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
                Профиль успешно обновлен!
              </div>
            )}

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="displayName">
                    Имя
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                  />
                </div>

                {userData?.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="age">
                        Возраст
                      </label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="interests">
                        Интересы (через запятую)
                      </label>
                      <input
                        id="interests"
                        name="interests"
                        type="text"
                        value={formData.interests?.join(', ') || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="skills">
                        Навыки (через запятую)
                      </label>
                      <input
                        id="skills"
                        name="skills"
                        type="text"
                        value={formData.skills?.join(', ') || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="field">
                        Предпочитаемая сфера
                      </label>
                      <input
                        id="field"
                        name="field"
                        type="text"
                        value={formData.field || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="education">
                        Образование
                      </label>
                      <input
                        id="education"
                        name="education"
                        type="text"
                        value={formData.education || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="experience">
                        Опыт работы
                      </label>
                      <textarea
                        id="experience"
                        name="experience"
                        value={formData.experience || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {saveLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {userData?.role === 'student' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Возраст</h3>
                        <p className="text-white">{userData.age || 'Не указан'}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Интересы</h3>
                        <div className="flex flex-wrap gap-2">
                          {userData.interests && userData.interests.length > 0 ? (
                            userData.interests.map((interest, index) => (
                              <span key={index} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                                {interest}
                              </span>
                            ))
                          ) : (
                            <p className="text-white">Не указаны</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Навыки</h3>
                        <div className="flex flex-wrap gap-2">
                          {userData.skills && userData.skills.length > 0 ? (
                            userData.skills.map((skill, index) => (
                              <span key={index} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-white">Не указаны</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Предпочитаемая сфера</h3>
                        <p className="text-white">{userData.field || 'Не указана'}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Образование</h3>
                        <p className="text-white">{userData.education || 'Не указано'}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Опыт работы</h3>
                        <p className="text-white">{userData.experience || 'Не указан'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Информация о компании</h3>
                    <p className="text-white">Вы можете добавить информацию о своей компании в настройках профиля.</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Редактировать профиль
                  </button>
                </div>
              </div>
            )}

            {/* Premium Section */}
            {userData?.role === 'student' && !userData.premium && (
              <div className="mt-8 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-500/30">
                <h3 className="text-xl font-bold text-white mb-2">JumysAl+ Premium</h3>
                <p className="text-gray-300 mb-4">
                  Получите доступ к AI-наставнику, персональным рекомендациям и другим премиум-функциям.
                </p>
                <Link
                  to="/subscribe"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Активировать Premium
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 