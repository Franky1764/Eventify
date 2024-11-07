import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { home, newspaper, camera, person } from 'ionicons/icons';
import { CreateEventComponent} from '../create-event/create-event.component'

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent {
    constructor(private modalController:ModalController) {
    addIcons({ home, newspaper, camera, person });
  }

  // Método para abrir el modal con el componente de creación de eventos
  async openCreateEventModal() {
    setTimeout(async () => {
      const modal = await this.modalController.create({
        component: CreateEventComponent,
        cssClass: 'create-event-modal'
      });
      await modal.present();
    }, 300);
  }
}