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
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';
import { auth, db } from './client';
import { doc, setDoc, getDoc, updateDoc, Timestamp, query, collection, where, getDocs } from 'firebase/firestore';

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
  displayName?: string
): Promise<FirebaseUser> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName: displayName || email.split('@')[0] });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName: displayName || email.split('@')[0],
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

// ============================================
// SIGN IN WITH GOOGLE
// ============================================
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    const user = result.user;
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // If not, create user document
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL || '',
        address: '',
        favorites: [],
        role: 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    
    console.log('✅ User signed in with Google:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error.message);
    throw new Error(`Google sign-in failed: ${error.message}`);
  }
}

// ============================================
// SIGN IN WITH GITHUB
// ============================================
export async function signInWithGitHub(): Promise<FirebaseUser> {
  try {
    const provider = new GithubAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    const user = result.user;
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // If not, create user document
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'GitHub User',
        photoURL: user.photoURL || '',
        address: '',
        favorites: [],
        role: 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    
    console.log('✅ User signed in with GitHub:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ GitHub sign-in error:', error.message);
    throw new Error(`GitHub sign-in failed: ${error.message}`);
  }
}

// ============================================
// LINK GUEST ORDERS TO USER ACCOUNT
// ============================================
export async function linkGuestOrdersToUser(
  userId: string,
  guestEmail: string
): Promise<number> {
  try {
    // Find all orders with this guest email and no user_id
    const q = query(
      collection(db, 'orders'),
      where('customer_email', '==', guestEmail.toLowerCase()),
      where('user_id', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    let linkedCount = 0;
    
    // Update each guest order to link to the new user
    for (const orderDoc of querySnapshot.docs) {
      await updateDoc(doc(db, 'orders', orderDoc.id), {
        user_id: userId,
        updatedAt: Timestamp.now(),
      });
      linkedCount++;
    }
    
    console.log(`✅ Linked ${linkedCount} guest orders to user:`, userId);
    return linkedCount;
  } catch (error: any) {
    console.error('❌ Error linking guest orders:', error.message);
    throw new Error(`Failed to link guest orders: ${error.message}`);
  }
}
