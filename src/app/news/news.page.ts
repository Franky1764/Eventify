import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EventDetailComponent } from '../components/event-detail/event-detail.component';
import { FirebaseService} from '../services/firebase.service';
import { getDocs, collection} from '@angular/fire/firestore';



@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage {
  events = []; // Aquí estarán los eventos traídos desde Firebase

  constructor(
    private modalController: ModalController,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit() {
    // Obtener eventos desde Firebase
    this.loadEvents();
  }
  async loadEvents() {
    const eventsCollection = this.firebaseService.getEvents();
    const querySnapshot = await getDocs(eventsCollection);

    this.events = querySnapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() as object }; // Convierte doc.data() en un objeto
    }); 
  }
  async openEventDetail(event) {
    const modal = await this.modalController.create({
      component: EventDetailComponent,
      componentProps: { event: event }, // Pasar el evento seleccionado al modal
    });
    return await modal.present();
  }
}

