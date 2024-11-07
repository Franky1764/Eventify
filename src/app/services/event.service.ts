import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore'; 
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private collectionName = 'events'; 

  constructor(private firestore: AngularFirestore) { }

  getEvents(): Observable<any[]> {
    return this.firestore.collection(this.collectionName).valueChanges();
  }
}
