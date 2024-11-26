import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service'; // Servicio Firebase
import { Event } from '../models/event.model'; // Modelo de eventos
import { ModalController } from '@ionic/angular'; // Mantenemos ModalController
import { CreateEventComponent } from '../create-event/create-event.component'; // Componente de creación/edición de eventos
import { UtilsService } from '../services/utils.service'; // Importamos UtilsService

@Component({
  selector: 'app-category-details',
  templateUrl: './category-details.page.html',
  styleUrls: ['./category-details.page.scss'],
})
export class CategoryDetailsPage implements OnInit {
  categoryName: string = ''; // Nombre de la categoría
  events: Event[] = []; // Lista de eventos
  isLoading = true; // Para mostrar un loader mientras se cargan los eventos

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService, // Servicio Firebase
    private modalController: ModalController, // Mantenemos ModalController
    private utilsSvc: UtilsService // Inyectamos UtilsService
  ) {}

  ngOnInit() {
    const routeCategoryName = this.route.snapshot.paramMap.get('categoryName') || '';
    this.categoryName = this.formatCategoryName(routeCategoryName);

    if (this.categoryName) {
      this.loadEvents();
    }
  }

  formatCategoryName(categoryName: string): string {
    // Reemplazar guiones por espacios y capitalizar la primera letra
    let formattedName = categoryName.replace(/-/g, ' ');
    return formattedName.charAt(0).toUpperCase() + formattedName.slice(1).toLowerCase();
  }

  async loadEvents() {
    try {
      this.isLoading = true;
      // Llama al método del servicio para obtener eventos por categoría
      this.events = await this.firebaseService.getEventsByCategory(this.categoryName);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      await this.utilsSvc.presentToast({
        message: 'Error al cargar eventos. Intenta de nuevo más tarde.',
        color: 'danger',
        duration: 2000,
        position: 'bottom'
      });
    } finally {
      this.isLoading = false;
    }
  }

  async editEvent(event: Event) {
    try {
      const modal = await this.modalController.create({
        component: CreateEventComponent,
        componentProps: { event },
        cssClass: 'create-event-modal',
      });

      modal.onDidDismiss().then(async (result) => {
        if (result.data) {
          const updatedEvent = result.data;
          const index = this.events.findIndex((e) => e.uid === updatedEvent.uid);
          if (index !== -1) {
            this.events[index] = updatedEvent; // Actualiza la lista local con los cambios
          }
          await this.utilsSvc.presentToast({
            message: 'Evento editado correctamente.',
            color: 'success',
            duration: 2000,
            position: 'bottom'
          });
        }
      });

      await modal.present();
    } catch (error) {
      console.error('Error al abrir el modal de edición:', error);
      await this.utilsSvc.presentToast({
        message: 'Error al editar el evento.',
        color: 'danger',
        duration: 2000,
        position: 'bottom'
      });
    }
  }

  async deleteEvent(eventId: string) {
    await this.utilsSvc.presentConfirmAlert({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este evento?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmHandler: async () => {
        try {
          await this.firebaseService.deleteEvent(eventId);
          this.events = this.events.filter(event => event.uid !== eventId); // Actualiza la lista local
          await this.utilsSvc.presentToast({
            message: 'Evento eliminado correctamente.',
            color: 'success',
            duration: 2000,
            position: 'bottom'
          });
        } catch (error) {
          console.error('Error al eliminar evento:', error);
          await this.utilsSvc.presentToast({
            message: 'Error al eliminar el evento. Intenta de nuevo.',
            color: 'danger',
            duration: 2000,
            position: 'bottom'
          });
        }
      }
    });
  }

}
