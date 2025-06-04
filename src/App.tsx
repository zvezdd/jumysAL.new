import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Компоненты
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Home from './components/Home';
import JobsWithErrorBoundary from './components/Jobs';
import PostDetail from './components/PostDetail';
import About from './components/About';
import Contact from './components/Contact';
import AIMentor from './components/AIMentor';
import ResumeGenerator from './components/ResumeGenerator';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import CreatePost from './components/CreatePost';
import { initializeTheme } from './utils/theme';
import MinimalJobsList from './components/MinimalJobsList';

// Initialize theme as early as possible
initializeTheme();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, userData } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-accent"></div>
        <div className="ml-2">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Проверка роли, если указаны разрешенные роли
  if (allowedRoles && (!userData?.role || !allowedRoles.includes(userData.role))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  console.log("App rendering");
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-dark text-gray-900 dark:text-white">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/jobs" element={<JobsWithErrorBoundary />} />
              <Route path="/jobs/:id" element={<PostDetail />} />
              <Route path="/ai-mentor" element={<AIMentor />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resume-generator" element={<ResumeGenerator />} />
              
              {/* Protected route for creating posts (only for employers) */}
              <Route 
                path="/create-post" 
                element={
                  <ProtectedRoute allowedRoles={['employer', 'business']}>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              
              {/* Chat routes */}
              <Route 
                path="/chats" 
                element={
                  <ProtectedRoute>
                    <ChatList />
                  </ProtectedRoute>
                }
              />
              
              <Route 
                path="/chat/:id" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;