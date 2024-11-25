import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service'; // Servicio Firebase
import { Event } from '../models/event.model'; // Modelo de eventos
import { AlertController, ModalController, ToastController } from '@ionic/angular'; // Ionic para modal y notificaciones
import { CreateEventComponent } from '../create-event/create-event.component'; // Componente de creación/edición de eventos

@Component({
  selector: 'app-category-details',
  templateUrl: './category-details.page.html',
  styleUrls: ['./category-details.page.scss'],
})
export class CategoryDetailsPage implements OnInit {
  categoryName: string | null = null;
  events: Event[] = []; // Lista de eventos
  isLoading = true; // Para mostrar un loader mientras se cargan los eventos

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService, // Servicio Firebase
    private alertController: AlertController, // Para confirmación
    private toastController: ToastController, // Para notificaciones
    private modalController: ModalController // Para manejar modales
  ) {}

  ngOnInit() {
    this.categoryName = this.route.snapshot.paramMap.get('categoryName') || '';

    if (this.categoryName) {
      this.loadEvents();
    }
  }

  async loadEvents() {
    try {
      this.isLoading = true;
      // Llama al método del servicio para obtener eventos por categoría
      this.events = await this.firebaseService.getEventsByCategory(this.categoryName);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      await this.showToast('Error al cargar eventos. Intenta de nuevo más tarde.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async editEvent(event: Event) {
    try {
      const modal = await this.modalController.create({
        component: CreateEventComponent, // Usamos el componente de creación/edición
        componentProps: { event }, // Pasamos el evento actual al modal
        cssClass: 'create-event-modal', 
      });

      // Escuchar cuando el modal se cierra
      modal.onDidDismiss().then(async (result) => {
        if (result.data) {
          const updatedEvent = result.data;
          const index = this.events.findIndex((e) => e.uid === updatedEvent.uid);
          if (index !== -1) {
            this.events[index] = updatedEvent; // Actualiza la lista local con los cambios
          }
          await this.showToast('Evento editado correctamente.', 'success');
        }
      });

      await modal.present();
    } catch (error) {
      console.error('Error al abrir el modal de edición:', error);
      await this.showToast('Error al editar el evento.', 'danger');
    }
  }

  async deleteEvent(eventId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este evento?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.firebaseService.deleteEvent(eventId);
              this.events = this.events.filter(event => event.uid !== eventId); // Actualiza la lista local
              await this.showToast('Evento eliminado correctamente.', 'success');
            } catch (error) {
              console.error('Error al eliminar evento:', error);
              await this.showToast('Error al eliminar el evento. Intenta de nuevo.', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
