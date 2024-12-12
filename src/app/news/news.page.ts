import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EventDetailComponent } from '../components/event-detail/event-detail.component';
import { FirebaseService } from '../services/firebase.service';
import { UtilsService } from '../services/utils.service';
import { ExportToExcelService } from '../services/export-to-excel.service';
import { Event } from '../models/event.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage implements OnInit {
  events: Event[] = []; // Aquí estarán los eventos traídos desde Firebase
  isLoading = true; // Para mostrar un spinner mientras se cargan los eventos

  constructor(
    private modalController: ModalController,
    private firebaseService: FirebaseService,
    private utilsService: UtilsService,
    private exportToExcelService: ExportToExcelService,
    private firestore: AngularFirestore
  ) {}

  async ngOnInit() {
    await this.loadEvents();
  }

  async loadEvents() {
    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      const eventsCollection = this.firestore.collection<Event>('events');
      const querySnapshot = await eventsCollection.get().toPromise();

      this.events = querySnapshot.docs.map((doc) => {
        return { uid: doc.id, ...doc.data() };
      });
    } catch (error) {
      console.error('Error cargando eventos:', error);
      this.utilsService.presentToast({
        message: 'Error al cargar eventos',
        color: 'danger',
        duration: 2500,
      });
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async openEventDetail(event: Event) {
    const modal = await this.modalController.create({
      component: EventDetailComponent,
      componentProps: { event: event },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.updated || data?.deleted) {
      // Recargar la lista de eventos si se actualizó o eliminó alguno
      await this.loadEvents();
    }
  }

  async downloadEvents() {
    if (this.events.length > 0) {
      await this.exportToExcelService.exportAsExcel(this.events, 'EventosEasyMMeeT');
    } else {
      console.error('No hay eventos para descargar');
      this.utilsService.presentToast({
        message: 'No hay eventos para descargar',
        color: 'danger',
        duration: 2500,
      });
    }
  }

  async handleRefresh(event) {
    try {
      await this.loadEvents();
    } finally {
      event.target.complete();
    }
  }
}
