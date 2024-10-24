import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { WritableSignal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User | undefined;

  constructor(
    private sqliteService: SqliteService
  ) {
    this.loadUser();
  }

  async loadUser() {
    try {
      const users = this.sqliteService.getUser()();
      if (users.length > 0) {
        this.user = users[0];
        console.log('User loaded successfully', this.user);
      } else {
        console.log('No users found in the database');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  async logout() {
    const user = this.user;
    if (user && user.uid) {
      try {
        await this.sqliteService.deleteUserById(user.uid);
        console.log('User logged out successfully');
      } catch (error) {
        console.error('Error logging out user:', error);
      }
    }
  }

  updateProfilePhoto(userId: string, photoUrl: string) {
    return this.sqliteService.updateProfilePhoto(userId, photoUrl);
  }
}