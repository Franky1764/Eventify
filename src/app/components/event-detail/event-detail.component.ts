import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from '../../services/firebase.service';
import { CreateEventComponent } from 'src/app/create-event/create-event.component';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent {
  @Input() event: any;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private firebaseService: FirebaseService
  ) {}

  // Método para cerrar el modal
  dismissModal() {
    this.modalController.dismiss();
  }

  // Método para registrarse en el evento (a implementar)
  registrarse() {
    this.showToast('Funcionalidad de registro pendiente.');
    // Aquí se implementará la lógica para registrarse al evento
  }

  // Método para editar el evento
  async editarEvento() {
    const modal = await this.modalController.create({
      component: CreateEventComponent,  // Reutilizamos el mismo componente de create event
      componentProps: { event: this.event }  // Pasamos el evento al modal
    });
    return await modal.present();
  }
  

  // Método para eliminar el evento
  async eliminarEvento() {
    try {
      await this.firebaseService.deleteEvent(this.event.uid);
      this.showToast('Evento eliminado correctamente.');
      this.dismissModal();
    } catch (error) {
      this.showToast('Error al eliminar el evento.');
      console.error(error);
    }
  }

  // Método para mostrar un toast
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // El toast se cerrará automáticamente después de 2 segundos
      position: 'bottom',
    });
    await toast.present();
  }
}
