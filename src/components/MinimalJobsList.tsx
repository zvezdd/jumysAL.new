import React from 'react';

// Sample demo data that doesn't depend on any external state
const MINIMAL_DEMO_JOBS = [
  {
    id: '1',
    title: 'Frontend Developer',
    companyName: 'KazTech Solutions',
    location: 'Almaty'
  },
  {
    id: '2',
    title: 'Backend Engineer',
    companyName: 'Digital Nomads',
    location: 'Astana'
  },
  {
    id: '3',
    title: 'UI/UX Designer',
    companyName: 'CreativeMinds',
    location: 'Remote'
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    companyName: 'CloudSystems KZ',
    location: 'Almaty'
  },
  {
    id: '5',
    title: 'Product Manager',
    companyName: 'TechStart',
    location: 'Astana'
  }
];

/**
 * A completely standalone minimal Jobs component that doesn't use Firebase
 * This is used for debugging routing issues
 */
const MinimalJobsList: React.FC = () => {
  console.log("💥 MINIMAL JOBS COMPONENT RENDERING 💥");
  
  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden p-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Вакансии (Минимальная версия)</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
              Тестовый режим
            </span>
          </div>
          
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Это минимальная тестовая версия страницы вакансий, используемая для отладки маршрутизации.
            Она не подключена к Firebase и просто отображает демо-данные.
          </p>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {MINIMAL_DEMO_JOBS.map(job => (
              <div key={job.id} className="py-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{job.title}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>{job.companyName}</span>
                  <span className="mx-2">•</span>
                  <span>{job.location}</span>
                </div>
                <div className="mt-3">
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition duration-150">
                    Подать заявку
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 text-center">
              Эта страница используется только для отладки. Пожалуйста, используйте полную версию страницы вакансий.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalJobsList; 