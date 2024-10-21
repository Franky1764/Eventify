import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { EventDetailComponent } from '../event-detail/event-detail.component';
import { ModalController } from '@ionic/angular';
import { Event } from '../models/event.model';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage implements OnInit {
  events: Event[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private modalController: ModalController  // Inyectar el controlador de modales
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  // Método para cargar eventos desde Firebase
  loadEvents() {
    this.firebaseService.getEvents().subscribe(
      (events: Event[]) => {
        this.events = events;
      },
      (error) => {
        console.error('Error al cargar los eventos:', error);
      }
    );
  }

  // Método para abrir el modal con los detalles del evento
  async openEventDetail(event: Event) {
    const modal = await this.modalController.create({
      component: EventDetailComponent,
      componentProps: { event }  // Pasar los detalles del evento al modal
    });
    return await modal.present();
  }
}