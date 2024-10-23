import { inject, Injectable, Injector } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, addDoc, updateDoc, deleteDoc, collection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { SqliteService } from './sqlite.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private userId: string | null = null;

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  storage = inject(AngularFireStorage);
  storageSvc = inject(StorageService);
  private router: Router;
  private injector: Injector;
  private _sqliteService: SqliteService;

  constructor(injector: Injector) {
    this.injector = injector;
    this.router = injector.get(Router);
  }

  private get sqliteService(): SqliteService {
    if (!this._sqliteService) {
      this._sqliteService = this.injector.get(SqliteService);
    }
    return this._sqliteService;
  }

  private async setSession(userId: string): Promise<void> {
    await this.storageSvc.setSession({ userId });
  }

  //CRUD USUARIOS
  async signIn(user: User): Promise<void> {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(user.email, user.password);
      const userId = userCredential.user?.uid;
      if (userId) {
        const userDoc = await this.firestore.collection('users').doc(userId).get().toPromise();
        if (userDoc.exists) {
          const userData = userDoc.data() as User;
          userData.uid = userId; // Asegurarse de que el uid se guarde en userData
          await this.sqliteService.saveUser(userData); // Guardar el usuario en SQLite
          await this.setSession(userId);
          this.router.navigate(['/tabs/dashboard']);
        } else {
          console.error('User document not found in Firestore');
        }
      } else {
        console.error('No user ID found after sign-in');
      }
    } catch (error) {
      console.error('Error signing in:', error);
    }
  }

  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  async getUserId(): Promise<string | null> {
    const session = await this.storageSvc.getSession();
    return session ? session.userId : null;
  }

  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  deleteUser() {
    return getAuth().currentUser.delete();
  }

  // Descargar datos del usuario desde Firestore a SQLite
  async downloadUserData(userId: string) {
    const userDoc = await this.firestore.collection('users').doc(userId).get().toPromise();
    const userData = userDoc.data() as User;
    //await this.sqliteService.saveUser(userData);
  }

  //SUBIR IMAGEN DE PERFIL
  uploadImage(imageData: string, filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileRef = this.storage.ref(filePath);
      const task = fileRef.putString(imageData, 'data_url');

      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            resolve(url);
          }, err => {
            reject(err);
          });
        })
      ).subscribe();
    });
  }

  updateProfilePhoto(userId: string, photoUrl: string) {
    return this.firestore.collection('users').doc(userId).update({ 'profilePhoto': photoUrl });
  }

  //BASE DE DATOS USUARIOS
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  //CRUD EVENTOS

  getEvents() {
    const firestore = getFirestore();
    return collection(firestore, 'events');
  }
  createEvent(event: Event) {
    return addDoc(collection(getFirestore(), 'events'), event);
  }
  getEventById(eventId: string) {
    return doc(getFirestore(), 'events', eventId);
  }
  updateEvent(eventId: string, data: any) {
    return updateDoc(doc(getFirestore(), 'events', eventId), data);
  }
  deleteEvent(eventId: string) {
    return deleteDoc(doc(getFirestore(), 'events', eventId));
  }

  async getDatabaseJson(collectionName: string): Promise<string> {
    const snapshot = await firstValueFrom(this.firestore.collection(collectionName).get());
    const data = snapshot.docs.map(doc => doc.data());
    console.log(JSON.stringify(data));
    return JSON.stringify(data);
  }
}