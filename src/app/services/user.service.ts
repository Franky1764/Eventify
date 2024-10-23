import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { Injectable, Injector } from '@angular/core'; // Importa Injector
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { SqliteService } from './sqlite.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private injector: Injector;
  private _sqliteService: SqliteService; // Añadimos una propiedad para SqliteService

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    injector: Injector // Inyecta Injector en lugar de SqliteService
  ) {
    this.injector = injector;
  }

  private get sqliteService(): SqliteService {
    if (!this._sqliteService) {
      this._sqliteService = this.injector.get(SqliteService);
    }
    return this._sqliteService;
  }

  register(user: User): Promise<void> {
    return this.afAuth.createUserWithEmailAndPassword(user.email, user.password)
      .then(userCredential => {
        const userId = userCredential.user?.uid;
        return this.firestore.collection('users').doc(userId).set({
          username: user.username,
          email: user.email,
          nivel: 1,
          nombre: "",
          apellido: "",
          edad: "",
          whatsapp: "",
          carrera: "",
          sede: "",
          profilePhoto: ""
        });
      });
  }

  getUsers(): Observable<User[]> {
    return this.firestore.collection<User>('users').valueChanges();
  }

  getUser(userId: string): Observable<User> {
    return this.firestore.collection('users').doc<User>(userId).valueChanges();
  }

  updateUser(userId: string, datos: any): Promise<void> {
    return this.firestore.collection('users').doc(userId).update(datos);
  }

  async syncProfilePhoto(userId: string): Promise<string> {
    try {
      const profilePhoto = await this.sqliteService.getProfilePhoto(userId);
      return profilePhoto;
    } catch (error) {
      console.error('Error syncing profile photo', error);
      return '';
    }
  }

  async logoutUser(userId: string): Promise<void> {
    try {
      await this.sqliteService.deleteUser(userId);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out user:', error);
    }
  }
}