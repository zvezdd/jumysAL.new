import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'school' | 'business';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const [authError, setAuthError] = useState<Error | null>(error);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  // Получаем дополнительные данные пользователя из Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setUserLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            console.warn('User document does not exist in Firestore');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        } finally {
          setUserLoading(false);
        }
      } else {
        setUserData(null);
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Update error state when the useAuthState error changes
  useEffect(() => {
    setAuthError(error);
  }, [error]);

  const login = async (email: string, password: string) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(err as Error);
      throw err;
    }
  };

  const signup = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with user name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore
      const userData: UserData = {
        uid: userCredential.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // Обновляем локальное состояние
      setUserData(userData);
      
    } catch (err) {
      console.error('Signup error:', err);
      setAuthError(err as Error);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
      console.log('Successfully signed out from Firebase');
      return Promise.resolve();
    } catch (err) {
      console.error('Logout error:', err);
      setAuthError(err as Error);
      return Promise.reject(err);
    }
  };

  const combinedLoading = loading || userLoading;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      loading: combinedLoading, 
      error: authError, 
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 