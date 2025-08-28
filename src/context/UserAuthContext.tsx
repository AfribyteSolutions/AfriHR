"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { IEmployee } from '@/interface'; // Assuming your IEmployee interface is here

// Define the shape of the data that will be in the context
interface AuthUserContextType {
  user: IEmployee | null; // Full employee data from Firestore
  loading: boolean;       // Overall loading state for context data
  error: any;             // Any error during fetching
  setAuthUser: (user: IEmployee | null) => void; // Function to set user data manually (e.g., after login)
}

// Create the context with a default undefined value
const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

// Props for the provider
interface AuthUserProviderProps {
  children: ReactNode;
}

export const AuthUserProvider: React.FC<AuthUserProviderProps> = ({ children }) => {
  const [firebaseUser, loadingFirebaseAuth, errorFirebaseAuth] = useAuthState(auth);
  const [authUser, setAuthUser] = useState<IEmployee | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (loadingFirebaseAuth) {
        // Still loading Firebase Auth, do nothing yet
        return;
      }

      if (errorFirebaseAuth) {
        setContextError(errorFirebaseAuth);
        setLoadingContext(false);
        return;
      }

      if (firebaseUser) {
        // User is logged in via Firebase Auth, now fetch their full profile from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            // Cast the data to your IEmployee interface
            setAuthUser({ uid: firebaseUser.uid, ...userSnap.data() } as IEmployee);
          } else {
            console.warn("Firestore document not found for authenticated user:", firebaseUser.uid);
            // If doc doesn't exist, you might still want a basic user object
            setAuthUser({ uid: firebaseUser.uid, email: firebaseUser.email || '', fullName: firebaseUser.displayName || 'Unknown', role: 'employee', companyId: '' } as IEmployee);
          }
        } catch (err) {
          console.error("Error fetching user data for context:", err);
          setContextError(err);
        } finally {
          setLoadingContext(false);
        }
      } else {
        // No Firebase user, clear context and stop loading
        setAuthUser(null);
        setLoadingContext(false);
      }
    };

    fetchUserData();
  }, [firebaseUser, loadingFirebaseAuth, errorFirebaseAuth]); // Depend on firebase auth state changes

  // Value provided by the context
  const contextValue = {
    user: authUser,
    loading: loadingContext,
    error: contextError,
    setAuthUser, // Allow external components (like login form) to set the user
  };

  return (
    <AuthUserContext.Provider value={contextValue}>
      {children}
    </AuthUserContext.Provider>
  );
};

// Custom hook to consume the context
export const useAuthUserContext = () => {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error('useAuthUserContext must be used within an AuthUserProvider');
  }
  return context;
};