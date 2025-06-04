import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

interface CompanyData {
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  logo?: string;
}

const CompanyProfile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    logo: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (user) {
        const companyDoc = await getDoc(doc(db, 'companies', user.uid));
        if (companyDoc.exists()) {
          setCompanyData(companyDoc.data() as CompanyData);
        }
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, 'companies', user.uid), companyData as { [key: string]: any });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating company profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">{t('profile.companyProfile')}</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          {isEditing ? t('common.cancel') : t('common.edit')}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.companyName')}
            </label>
            <input
              type="text"
              name="name"
              value={companyData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('profile.companyDescription')}
            </label>
            <textarea
              name="description"
              value={companyData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={companyData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={companyData.industry}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Size
              </label>
              <input
                type="text"
                name="size"
                value={companyData.size}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={companyData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">{companyData.name}</h2>
            <p className="text-gray-300 mb-4">{companyData.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Website:</span>
                <a 
                  href={companyData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 ml-2"
                >
                  {companyData.website}
                </a>
              </div>
              <div>
                <span className="text-gray-400">Industry:</span>
                <span className="text-white ml-2">{companyData.industry}</span>
              </div>
              <div>
                <span className="text-gray-400">Size:</span>
                <span className="text-white ml-2">{companyData.size}</span>
              </div>
              <div>
                <span className="text-gray-400">Location:</span>
                <span className="text-white ml-2">{companyData.location}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile; 