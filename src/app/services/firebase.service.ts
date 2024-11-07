import { inject, Injectable, Injector } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, getDoc, doc, addDoc, updateDoc, deleteDoc, collection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { SqliteService } from './sqlite.service';
import { firstValueFrom, Observable } from 'rxjs';
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

  constructor(injector: Injector, private afAuth: AngularFireAuth) {
    this.injector = injector;
    this.router = injector.get(Router);
    // Establecer persistencia en 'local' para mantener la sesión
    this.afAuth.setPersistence('local');
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
          console.log('User data:', JSON.stringify(userData));
          await this.sqliteService.addUser(userData); // Guardar el usuario en SQLite
          await this.setSession(userId);
          // User signed in successfully
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

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  deleteUser() {
    return getAuth().currentUser.delete();
  }

  getUsers(): Observable<User[]> {
    return this.firestore.collection<User>('users').valueChanges();
  }

  getUser(userId: string): Observable<User> {
    return this.firestore.collection('users').doc<User>(userId).valueChanges();
  }

  updateUserInFirestore(user: User) {
    // Si el usuario ya existe, se actualizan sus datos
    const existingUser = this.sqliteService.getUser()[0];
    if (existingUser) {
      user = { ...existingUser, ...user };
    }
    return this.firestore.collection('users').doc(user.uid).update(user);
  }

  async signOut(): Promise<void> {
    try {
      await this.afAuth.signOut();
      console.log('Usuario ha cerrado sesión correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  //REGISTRAR DOCUMENTO EN FIRESTORE
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  getDocument(path: string) {
    const docRef = doc(getFirestore(), path);
    return getDoc(docRef);
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


  //CRUD EVENTOS

  getEvents() {
    const firestore = getFirestore();
    return collection(firestore, 'events');
  }
  
  createEvent(event: Event) {
    const { uid, ...eventData } = event;
    return addDoc(collection(getFirestore(), 'events'), eventData);
  }

  async updateEvent(eventId: string, data: Partial<Event>): Promise<boolean> {
    const eventRef = doc(getFirestore(), 'events', eventId);
    try {
      await updateDoc(eventRef, data);
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  getEventById(eventId: string) {
    return getDoc(doc(getFirestore(), 'events', eventId));
  }

  deleteEvent(eventId: string) {
    return deleteDoc(doc(getFirestore(), 'events', eventId));
  }

  //ESTA FUNCION LA USAREMOS PARA OBTENER LOS DATOS DE LA COLECCION EVENTS DE FIRESTORE
  async getDatabaseJson(collectionName: string): Promise<string> {
    const snapshot = await firstValueFrom(this.firestore.collection(collectionName).get());
    const data = snapshot.docs.map(doc => doc.data());
    console.log(JSON.stringify(data));
    return JSON.stringify(data);
  }

  // Método para obtener el estado de autenticación
  getAuthState() {
    return this.afAuth.authState;
  }

}