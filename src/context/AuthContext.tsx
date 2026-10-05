import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  auth,
  getUserRoleFromFirestore,
  syncUserDocumentInFirestore,
  subscribeToFirebaseAuthState,
  firebaseSignOut,
} from '../lib/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextType {
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  isLoading: boolean;
  isAdmin: boolean;
  refreshRoleFromFirestore: (uid?: string, email?: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const defaultUser: UserProfile = {
  isLoggedIn: false,
  name: '',
  email: '',
  phone: '',
  role: 'customer',
  walletBalance: 0,
  hasReceivedBonus: false,
  isPhoneVerified: false,
  authProvider: 'google',
  walletHistory: [],
  address: {
    fullName: '',
    phone: '',
    cityDivision: 'Inside Dhaka',
    fullAddress: '',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; userState: UserProfile; onUpdateUser: (u: UserProfile) => void }> = ({
  children,
  userState,
  onUpdateUser,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile, role, and wallet balance with Firestore database (`users/{uid}`)
  const refreshRoleFromFirestore = async (uid?: string, email?: string): Promise<UserRole> => {
    const targetUid = uid || firebaseUser?.uid || userState.email || 'guest';
    const targetEmail = email || firebaseUser?.email || userState.email;

    const synced = await syncUserDocumentInFirestore({
      uid: targetUid,
      email: targetEmail,
      displayName: userState.name,
      photoURL: userState.avatar,
    });

    onUpdateUser({
      ...userState,
      role: synced.role,
      walletBalance: synced.walletBalance,
      hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus,
    });

    return synced.role;
  };

  useEffect(() => {
    // Subscribe to Firebase Auth state change & retrieve persisted backend user state
    const unsubscribe = subscribeToFirebaseAuthState(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const synced = await syncUserDocumentInFirestore({
          uid: fUser.uid,
          email: fUser.email,
          displayName: fUser.displayName,
          photoURL: fUser.photoURL,
        });

        onUpdateUser({
          ...userState,
          uid: fUser.uid,
          isLoggedIn: true,
          name: synced.displayName || fUser.displayName || userState.name || 'Kroy Ghor Member',
          email: synced.email || fUser.email || userState.email,
          role: synced.role,
          walletBalance: synced.walletBalance,
          hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus,
          avatar: synced.photoURL || fUser.photoURL || userState.avatar,
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut();
    onUpdateUser({
      ...defaultUser,
    });
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    onUpdateUser({
      ...userState,
      ...updated,
    });
  };

  const isAdmin = Boolean(
    userState.isLoggedIn && (userState.role === 'admin' || userState.role === 'super_admin')
  );

  return (
    <AuthContext.Provider
      value={{
        user: userState,
        firebaseUser,
        role: userState.role,
        isLoading,
        isAdmin,
        refreshRoleFromFirestore,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
