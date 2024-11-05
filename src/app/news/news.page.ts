import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EventDetailComponent } from '../components/event-detail/event-detail.component';
import { FirebaseService} from '../services/firebase.service';
import { getDocs, collection} from '@angular/fire/firestore';
import { UtilsService } from '../services/utils.service';




@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage {
  events = []; // Aquí estarán los eventos traídos desde Firebase
  isLoading = true; // Para mostrar un spinner mientras se cargan los eventos

  constructor(
    private modalController: ModalController,
    private firebaseService: FirebaseService,
    private utilsService: UtilsService
  ) {}

  async ngOnInit() {
    await this.loadEvents();
  }

  async loadEvents() {
    const loading = await this.utilsService.loading();
    await loading.present();
    
    try {
      const eventsCollection = this.firebaseService.getEvents();
      const querySnapshot = await getDocs(eventsCollection);
  
      this.events = querySnapshot.docs.map((doc) => {
        return { uid: doc.id, ...doc.data() as object };
      });
    } catch (error) {
      console.error('Error cargando eventos:', error);
      this.utilsService.presentToast({
        message: 'Error al cargar eventos',
        color: 'danger',
        duration: 2500
      });
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }
  
  async openEventDetail(event) {
    const modal = await this.modalController.create({
      component: EventDetailComponent,
      componentProps: { event: event }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.updated || data?.deleted) {
      // Recargar la lista de eventos si se actualizó o eliminó alguno
      await this.loadEvents();
    }
  }
}
