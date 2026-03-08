// Firebase Authentication Helpers
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from './client';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Export auth for direct use in components
export { auth };

// Set persistence to local so user stays logged in
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set persistence:', error);
});

// ============================================
// REGISTER NEW USER
// ============================================
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName,
      address: '',
      favorites: [],
      role: 'user',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ User registered:', email);
    return user;
  } catch (error: any) {
    console.error('❌ Registration error:', error.message);
    throw new Error(`Registration failed: ${error.message}`);
  }
}

// ============================================
// LOGIN USER
// ============================================
export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User logged in:', email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    throw new Error(`Login failed: ${error.message}`);
  }
}

// ============================================
// LOGOUT USER
// ============================================
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('✅ User logged out');
  } catch (error: any) {
    console.error('❌ Logout error:', error.message);
    throw new Error(`Logout failed: ${error.message}`);
  }
}

// ============================================
// GET CURRENT USER
// ============================================
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

// ============================================
// LISTEN TO AUTH STATE CHANGES
// ============================================
export function onUserStateChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ============================================
// UPDATE USER PROFILE
// ============================================
export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    photoURL?: string;
    address?: string;
    email?: string;
  }
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: updates.displayName || user.displayName || undefined,
      photoURL: updates.photoURL || user.photoURL || undefined,
    });

    // Update Firestore document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...(updates.displayName && { displayName: updates.displayName }),
      ...(updates.address && { address: updates.address }),
      ...(updates.photoURL && { photoURL: updates.photoURL }),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Profile updated');
  } catch (error: any) {
    console.error('❌ Update profile error:', error.message);
    throw new Error(`Profile update failed: ${error.message}`);
  }
}

// ============================================
// GET USER DOCUMENT FROM FIRESTORE
// ============================================
export async function getUserDocument(uid: string) {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error fetching user:', error.message);
    throw error;
  }
}
