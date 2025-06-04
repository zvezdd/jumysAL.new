import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, collection } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

console.log("🔥 Firebase initialization starting...");

// Firebase configuration should use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBFrDVlsCR8dDChhNr1bly5qvxC-tnzEhU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jumysal-a5ce4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jumysal-a5ce4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jumysal-a5ce4.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1028418533364",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1028418533364:web:940e10a031cd131a272ba1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1PCYJY4XWZ",
};

console.log("Firebase config:", { 
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
let app;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let dbInitPromise: Promise<Firestore> | null = null;

// Export getter function for Firestore that waits for initialization
export const getDb = async (): Promise<Firestore> => {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;
  
  return new Promise((resolve, reject) => {
    // Check every 100ms if db is initialized
    const checkInterval = setInterval(() => {
      if (db) {
        clearInterval(checkInterval);
        resolve(db);
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Firestore initialization timeout'));
    }, 10000);
  });
};

// Функция для безопасной инициализации Firestore с повторными попытками
const initFirestore = async (app: any, retries = 3, delay = 1000): Promise<Firestore> => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to initialize Firestore...`);
      const firestoreInstance = getFirestore(app);
      console.log("✅ Firebase Firestore initialized successfully");
      
      // Пробуем выполнить тестовый запрос для проверки соединения
      try {
        const testCollection = collection(firestoreInstance, 'posts');
        console.log("Test collection reference created for 'posts' collection");
      } catch (testError) {
        console.warn("Test collection access failed:", testError);
        // Продолжаем, так как ошибка может быть связана с правами доступа
      }
      
      return firestoreInstance;
    } catch (error) {
      console.error(`❌ Firestore initialization attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt < retries) {
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Увеличиваем задержку для каждой следующей попытки
      }
    }
  }
  
  // Все попытки не удались
  throw lastError;
};

try {
  console.log("Initializing Firebase app...");
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");

  // Initialize services
  console.log("Initializing Firebase services...");
  
  // Initialize Auth
  try {
    auth = getAuth(app);
    console.log("✅ Firebase Auth initialized successfully");
  } catch (authError) {
    console.error("❌ Firebase Auth initialization failed:", authError);
    throw authError; // Critical service, rethrow to stop initialization
  }
  
  // Initialize Firestore
  try {
    console.log("Initializing Firestore...");
    dbInitPromise = initFirestore(app, 3)
      .then(firestoreInstance => {
        db = firestoreInstance;
        
        // Enable offline persistence and return the db instance
        return enableIndexedDbPersistence(db)
          .then(() => {
            console.log("✅ Firebase offline persistence enabled");
            return db;
          })
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn("⚠️ Firebase persistence failed: Multiple tabs open. Persistence enabled in another tab.");
            } else if (err.code === 'unimplemented') {
              console.warn("⚠️ Firebase persistence failed: Browser does not support IndexedDB.");
            } else {
              console.error("❌ Firebase persistence error:", err.code, err.message);
            }
            // Always return db even if persistence fails
            return db;
          });
      })
      .catch(dbError => {
        console.error("❌ Firebase Firestore initialization failed after multiple attempts:", dbError);
        throw dbError; // Critical service, rethrow to stop initialization
      });
  } catch (dbError) {
    console.error("❌ Firebase Firestore initial setup failed:", dbError);
    throw dbError; // Critical service, rethrow to stop initialization
  }
  
  // Initialize Storage
  try {
    storage = getStorage(app);
    console.log("✅ Firebase Storage initialized successfully");
  } catch (storageError) {
    console.error("❌ Firebase Storage initialization failed:", storageError);
    // Non-critical, continue without rethrowing
  }
  
  // Initialize Functions
  try {
    functions = getFunctions(app);
    console.log("✅ Firebase Functions initialized successfully");
  } catch (functionsError) {
    console.error("❌ Firebase Functions initialization failed:", functionsError);
    // Non-critical, continue without rethrowing
  }
  
  console.log("🔥 All Firebase services initialized");
  
} catch (error) {
  console.error("❌ CRITICAL: Firebase initialization failed:", error);
  // Show an error UI if needed here
  alert("Критическая ошибка при инициализации Firebase. Пожалуйста, обновите страницу или попробуйте позже.");
}

// Export the Firebase services
export { auth, db, storage, functions };

// NOTE: For production deployment, these values should be stored in .env file:
// VITE_FIREBASE_API_KEY=AIzaSyBFrDVlsCR8dDChhNr1bly5qvxC-tnzEhU
// VITE_FIREBASE_AUTH_DOMAIN=jumysal-a5ce4.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=jumysal-a5ce4
// VITE_FIREBASE_STORAGE_BUCKET=jumysal-a5ce4.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=1028418533364
// VITE_FIREBASE_APP_ID=1:1028418533364:web:940e10a031cd131a272ba1
// VITE_FIREBASE_MEASUREMENT_ID=G-1PCYJY4XWZ