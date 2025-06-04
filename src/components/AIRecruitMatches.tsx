import React, { useState, useEffect } from 'react';
import { getMatchedCandidates, triggerCandidateMatching } from '../api/aiRecruit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface MatchedCandidate {
  studentId: string;
  displayName: string;
  photoURL?: string;
  totalScore: number;
  skillMatch: number;
  experienceMatch: number;
  locationMatch: number;
  universityMatch: number;
  resumeQualityScore: number;
  matchedAt: Date;
}

interface AIRecruitMatchesProps {
  jobId: string;
  isEmployer: boolean;
}

const AIRecruitMatches: React.FC<AIRecruitMatchesProps> = ({ jobId, isEmployer }) => {
  const [candidates, setCandidates] = useState<MatchedCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [jobDetails, setJobDetails] = useState<any>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        // Fetch job details to check if AI matching is enabled
        const jobDoc = await getDoc(doc(db, 'posts', jobId));
        if (!jobDoc.exists()) {
          setError('Вакансия не найдена');
          setLoading(false);
          return;
        }
        
        const jobData = jobDoc.data();
        setJobDetails(jobData);
        
        if (!jobData.aiMatching) {
          // AI matching not enabled for this job
          setLoading(false);
          return;
        }
        
        // Fetch matched candidates
        const matchedCandidates = await getMatchedCandidates(jobId);
        setCandidates(matchedCandidates);
      } catch (err) {
        console.error('Error fetching AI-matched candidates:', err);
        setError('Ошибка при загрузке кандидатов');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [jobId]);

  const handleRefreshMatches = async () => {
    if (!isEmployer) return;
    
    setRefreshing(true);
    try {
      const success = await triggerCandidateMatching(jobId);
      if (success) {
        // Refetch candidates after refreshing
        const matchedCandidates = await getMatchedCandidates(jobId);
        setCandidates(matchedCandidates);
      } else {
        setError('Не удалось обновить подбор кандидатов');
      }
    } catch (err) {
      console.error('Error refreshing candidates:', err);
      setError('Ошибка при обновлении кандидатов');
    } finally {
      setRefreshing(false);
    }
  };

  // If AI matching is not enabled or this is not the employer, don't show anything
  if ((!jobDetails?.aiMatching && !loading) || !isEmployer) {
    return null;
  }

  // Format percentage score
  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-blue-400 flex items-center">
          <span className="mr-2">🤖</span> AI-подбор кандидатов
        </h3>
        
        <button
          onClick={handleRefreshMatches}
          disabled={refreshing || loading}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${
            refreshing || loading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Обновление...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Обновить подбор
            </>
          )}
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 text-red-300 p-4 rounded-lg">
          {error}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-300 mb-2">Пока не найдено подходящих кандидатов</p>
          <p className="text-sm text-gray-400">
            Попробуйте изменить критерии подбора или нажмите "Обновить подбор"
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-blue-300 mb-4">
            AI проанализировал профили студентов и подобрал лучших кандидатов для вашей вакансии:
          </p>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {candidates.map((candidate) => (
              <div 
                key={candidate.studentId}
                className="bg-gray-800/80 rounded-lg p-4 hover:bg-gray-700/80 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {candidate.photoURL ? (
                      <img 
                        src={candidate.photoURL} 
                        alt={candidate.displayName} 
                        className="w-10 h-10 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full mr-3 bg-gray-600 flex items-center justify-center text-gray-300">
                        {candidate.displayName[0]}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-white">
                        {candidate.displayName}
                      </h4>
                      <div className="flex items-center mt-1">
                        <div className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded">
                          {formatScore(candidate.totalScore)} совпадение
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                    Связаться
                  </button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Навыки:</span>
                      <span className="text-gray-200 font-medium">{formatScore(candidate.skillMatch)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Опыт:</span>
                      <span className="text-gray-200 font-medium">{formatScore(candidate.experienceMatch)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Локация:</span>
                      <span className="text-gray-200 font-medium">{candidate.locationMatch ? 'Совпадает' : 'Не совпадает'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">ВУЗ:</span>
                      <span className="text-gray-200 font-medium">{candidate.universityMatch ? 'Приоритетный' : 'Обычный'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <a 
                    href={`/profile/${candidate.studentId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center transition-colors"
                  >
                    Просмотреть профиль
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          {candidates.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Предложить всем кандидатам
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRecruitMatches; 