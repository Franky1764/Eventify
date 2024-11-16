import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { WritableSignal } from '@angular/core';
import { User } from '../models/user.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User | undefined;

  constructor(
    private sqliteService: SqliteService,
    private firebaseService: FirebaseService,
  ) {}

  async loadUser() {
    try {
      const usersSignal = this.sqliteService.getUser();
      const users = usersSignal(); // Accede al valor del ReadableSignal
      if (users.length > 0) {
        this.user = users[0];
        console.log('Usuario cargado desde SQLite:', this.user);
      } else {
        console.log('No se encontró usuario en SQLite');

        // Cargar desde Firebase si no está en SQLite
        const userId = await this.firebaseService.getCurrentUserId();
        if (userId) {
          const userFromFirebase = await this.firebaseService.getUser(userId).toPromise();
          if (userFromFirebase) {
            this.user = userFromFirebase;
            await this.sqliteService.addUser(this.user);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar el usuario:', error);
    }
  }

  async logout() {
    if (this.user && this.user.uid) {
      try {
        await this.sqliteService.deleteUserById(this.user.uid);
        this.user = undefined;
        console.log('Usuario eliminado de SQLite y desconectado');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  }

  updateProfilePhoto(userId: string, photoUrl: string) {
    return this.sqliteService.updateProfilePhoto(userId, photoUrl);
  }
}