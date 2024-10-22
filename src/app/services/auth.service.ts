import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userId: string | null = null;

  constructor(private afAuth: AngularFireAuth, private storageService: StorageService) { }

  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      this.userId = userCredential.user?.uid || null;
      console.log(`Usuario logueado con ID: ${this.userId}`);
      await this.setSession(this.userId);
    } catch (error) {
      console.error('Error logging in', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.userId = null;
    await this.afAuth.signOut();
    await this.storageService.clearSession();
  }

  async getUserId(): Promise<string | null> {
    if (!this.userId) {
      const user = await this.afAuth.currentUser;
      this.userId = user?.uid || null;
    }
    return this.userId;
  }

  isLoggedIn(): boolean {
    return this.userId !== null;
  }

  private async setSession(userId: string): Promise<void> {
    await this.storageService.setSession({ userId });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}