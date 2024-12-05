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
import { firstValueFrom, Observable, from } from 'rxjs';
import { mergeMap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { getStorage } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { environment } from 'src/environments/environment';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private pendingUpdates: {userId: string, data: any}[] = [];
  private userId: string | null = null;
  private app = initializeApp(environment.firebaseConfig);
  private firebaseStorage = getStorage(this.app);

  auth = inject(AngularFireAuth);
  private http = inject(HttpClient);
  firestore = inject(AngularFirestore);
  storage = inject(AngularFireStorage);
  storageSvc = inject(StorageService);
  private injector: Injector;
  private _sqliteService: SqliteService;

  constructor(injector: Injector, private afAuth: AngularFireAuth) {
    this.injector = injector;
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

  //LOGICA PARA ACTUALIZAR DATOS EN MODO OFFLINE
  hasPendingUpdates(): boolean {
    return this.pendingUpdates.length > 0;
  }
  
  private queueUpdate(user: User) {
    this.pendingUpdates.push({
      userId: user.uid,
      data: user
    });
  }
  
  async syncPendingUpdates() {
    if (this.pendingUpdates.length > 0) {
      for (const update of this.pendingUpdates) {
        try {
          await this.firestore.collection('users').doc(update.userId).update(update.data);
          this.pendingUpdates = this.pendingUpdates.filter(u => u.userId !== update.userId);
        } catch (error) {
          console.error('Error syncing update:', error);
        }
      }
    }
  }

  //CRUD USUARIOS
  async signIn(email: string, password: string) {
    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
    this.userId = userCredential.user?.uid;
    await this.setSession(this.userId);
    return userCredential;
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

  async getUserData(userId: string): Promise<User | null> {
    try {
      const userDoc = await this.firestore.collection('users').doc<User>(userId).get().toPromise();
      if (userDoc?.exists) {
        const userData = userDoc.data();
        if (userData) {
          userData.uid = userId; // Asegurarse de agregar el UID al objeto
          return userData as User;
        }
      }
      return null;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      throw error;
    }
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

  async updateUserInFirestore(user: User) {
    try {
      const networkStatus = await Network.getStatus();
      
      if (networkStatus.connected) {
        await this.firestore.collection('users').doc(user.uid).update(user);
        return true;
      } else {
        this.queueUpdate(user);
        return false;
      }
    } catch (error) {
      console.error('Error updating Firestore:', error);
      this.queueUpdate(user);
      return false;
    }
  }

  //DESCARGAR LA IMAGEN DEL USUARIO PARA GUARDARLA EN SQLITE
  async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      // Obtener el token de autenticación
      const token = await (await this.auth.currentUser).getIdToken();
      
      // Descargar la imagen directamente de la URL con el token de autenticación
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Obtener el blob de la imagen
      const blob = await response.blob();
      
      // Convertir blob a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      return '';
    }
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


  // Obtener todos los eventos desde Firestore
  async getEventsByCategory(categoryName: string): Promise<Event[]> {
    try {
      const querySnapshot = await this.firestore
        .collection<Event>('events', (ref) =>
          ref.where('tipoActividad', '==', categoryName)
        )
        .get()
        .toPromise();
  
      return querySnapshot?.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) || [];
    } catch (error) {
      console.error('Error al obtener eventos por categoría:', error);
      return [];
    }
  }

}