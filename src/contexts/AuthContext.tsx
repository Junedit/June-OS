import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

export interface UserRoleData {
  role: 'owner' | 'member';
}

interface AuthContextType {
  user: User | null;
  userRole: 'owner' | 'member' | null;
  userData: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  updateUserData: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData(data);
            let role = data.role as 'owner' | 'member';
            const isEmailPassword = user.providerData.some(p => p.providerId === 'password');
            if (role === 'member' && isEmailPassword) {
              role = 'owner';
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(userDocRef, { role: 'owner' });
              setUserData({ ...data, role: 'owner' });
            }
            setUserRole(role);
          } else {
            // Check if any users exist to determine if this is the first user
            const usersSnap = await getDocs(collection(db, 'users'));
            const isFirstUser = usersSnap.empty;
            const isEmailPassword = user.providerData.some(p => p.providerId === 'password');
            const newRole = (isFirstUser || isEmailPassword) ? 'owner' : 'member';
            
            const newData = {
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: newRole,
              createdAt: new Date().toISOString(),
              onboardingCompleted: false
            };
            await setDoc(userDocRef, newData);
            setUserData(newData);
            setUserRole(newRole);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('member'); // Default fallback
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateUserData = async (data: any) => {
    if (!user) return;
    const { updateDoc } = await import('firebase/firestore');
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, data);
    setUserData(prev => ({ ...prev, ...data }));
  };

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup closed prematurely by the user.");
      } else {
        console.error("Error signing in", error);
        alert("Authentication failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading, signIn, logOut, signInWithEmail, registerWithEmail, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
