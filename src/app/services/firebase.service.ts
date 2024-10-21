import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, addDoc, updateDoc, deleteDoc, collection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  storage = inject(AngularFireStorage);



  //CRUD USUARIOS
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  deleteUser() {
    return getAuth().currentUser.delete();
  }

  signOut() {
    return this.auth.signOut();
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

  //CARGA DE IMAGEN DE USUARIO
  uploadUserImage(userId: string, imageFile: File): Promise<string> {
    const storageRef = this.storage.ref(`users/${userId}`);
    return storageRef.put(imageFile).then(() => {
      return storageRef.getDownloadURL().toPromise();
    });
  }



}
