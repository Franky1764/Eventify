import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { User } from '../models/user.model';
import { FirebaseService } from './firebase.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User | undefined;

  constructor(
    private sqliteService: SqliteService,
    private firebaseService: FirebaseService,
  ) {}

  async loadUser(): Promise<void> {
    try {
      const usersSignal = this.sqliteService.getUser();
      const users = usersSignal();

      if (users && users.length > 0) {
        this.user = users[0];
        console.log('Usuario cargado desde SQLite:', this.user);
        return;
      }

      console.log('No se encontró usuario en SQLite, intentando cargar desde Firebase');
      const userId = await this.firebaseService.getCurrentUserId();
      
      if (userId) {
        const userFromFirebase = await firstValueFrom(this.firebaseService.getUser(userId));
        if (userFromFirebase) {
          this.user = userFromFirebase;
          await this.sqliteService.addUser(this.user);
          console.log('Usuario cargado desde Firebase y guardado en SQLite:', this.user);
        }
      }
    } catch (error) {
      console.error('Error al cargar el usuario:', error);
      throw error;
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