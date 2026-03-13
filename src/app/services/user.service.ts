import { Injectable, NgZone } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersCollection = 'therapists';

  constructor(private firestore: Firestore, private ngZone: NgZone) {}

  /**
   * Create a new user document in Firestore
   */
  async createUserProfile(user: User): Promise<void> {
    return this.ngZone.run(async () => {
      const userDocRef = doc(this.firestore, this.usersCollection, user.uid);
      const userProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      try {
        await setDoc(userDocRef, userProfile);
        console.log('User profile created:', userProfile);
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    return this.ngZone.run(async () => {
      const userDocRef = doc(this.firestore, this.usersCollection, userId);
      try {
        await updateDoc(userDocRef, {
          lastLoginAt: new Date(),
        });
      } catch (error) {
        console.error('Error updating last login:', error);
        throw error;
      }
    });
  }

  /**
   * Get user profile by UID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.ngZone.run(async () => {
      const userDocRef = doc(this.firestore, this.usersCollection, userId);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          return {
            ...data,
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt as any),
            lastLoginAt: data.lastLoginAt instanceof Date ? data.lastLoginAt : new Date(data.lastLoginAt as any),
          };
        }
        return null;
      } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
      }
    });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    return this.ngZone.run(async () => {
      const userDocRef = doc(this.firestore, this.usersCollection, userId);
      try {
        await updateDoc(userDocRef, updates);
        console.log('User profile updated:', updates);
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    });
  }

  /**
   * Check if user exists in Firestore
   */
  async userExists(userId: string): Promise<boolean> {
    return this.ngZone.run(async () => {
      const userDocRef = doc(this.firestore, this.usersCollection, userId);
      try {
        const userDoc = await getDoc(userDocRef);
        return userDoc.exists();
      } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
      }
    });
  }

  /**
   * Get all users (for admin purposes)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    return this.ngZone.run(async () => {
      try {
        const usersQuery = query(collection(this.firestore, this.usersCollection));
        const querySnapshot = await getDocs(usersQuery);
        return querySnapshot.docs.map((doc) => {
          const data = doc.data() as UserProfile;
          return {
            ...data,
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt as any),
            lastLoginAt: data.lastLoginAt instanceof Date ? data.lastLoginAt : new Date(data.lastLoginAt as any),
          };
        });
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    });
  }
}

