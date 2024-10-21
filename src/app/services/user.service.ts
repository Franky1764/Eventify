import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { SqliteService } from './sqlite.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private sqliteService: SqliteService
  ) {}

  register(user: User): Promise<void> {
    return this.afAuth.createUserWithEmailAndPassword(user.email, user.password)
      .then(userCredential => {
        const userId = userCredential.user?.uid;
        return this.firestore.collection('users').doc(userId).set({
          username: user.username,
          email: user.email,
          nivel: 1,
          datos: [{
            nombre: "",
            apellido: "",
            edad: "",
            whatsapp: "",
            carrera: "",
            sede: "",
            profilePhoto: ""
          }]
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

  async syncProfilePhoto(userId: string): Promise<void> {
    const userDoc = await this.firestore.collection('users').doc(userId).get().toPromise();
    const userData = userDoc.data() as User;
    const profilePhoto = userData.datos[0]?.profilePhoto;
    if (profilePhoto) {
      await this.sqliteService.saveProfilePhoto(profilePhoto);
    }
  }

  async loadProfilePhoto(): Promise<string> {
    try {
      return await this.sqliteService.getProfilePhoto();
    } catch (error) {
      console.error('Error loading profile photo', error);
      return '';
    }
  }

  async clearProfilePhoto(): Promise<void> {
    await this.sqliteService.deleteProfilePhoto();
  }
}