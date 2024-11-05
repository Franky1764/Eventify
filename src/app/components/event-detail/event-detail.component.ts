import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FirebaseService } from '../../services/firebase.service';
import { CreateEventComponent } from 'src/app/create-event/create-event.component';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent {
  @Input() event: any;
  eventUpdated = false;
  eventDeleted = false; // Nueva bandera para indicar si el evento fue eliminado

  constructor(
    private modalController: ModalController,
    private firebaseService: FirebaseService,
    private utilsService: UtilsService
  ) {}

  // Método para cerrar el modal y pasar las banderas de actualización/eliminación
  dismissModal() {
    this.modalController.dismiss({ updated: this.eventUpdated, deleted: this.eventDeleted });
  }

  // Método para registrarse en el evento (a implementar)
  registrarse() {
    this.utilsService.presentToast({
      message: 'Funcionalidad de registro pendiente.',
      duration: 2000,
      color: 'warning'
    });
    // Aquí se implementará la lógica para registrarse al evento
  }

  // Método para editar el evento
  async editarEvento() {
    const modal = await this.modalController.create({
      component: CreateEventComponent,
      componentProps: {
        event: this.event, // Pasamos el evento completo
        isEditing: true
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.isEdit) {
      this.event = { ...data.event };
      this.eventUpdated = true; // Marcamos que el evento fue actualizado

      this.utilsService.presentToast({
        message: 'Evento actualizado correctamente',
        duration: 2000,
        color: 'primary'
      });

      // No cerramos el modal aquí; permitimos que el usuario lo haga cuando desee
    }
  }
  

  // Método para eliminar el evento con confirmación
  async eliminarEvento() {
    await this.utilsService.presentConfirmAlert({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este evento? Esta acción es irreversible.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmHandler: async () => {
        const loading = await this.utilsService.loading();
        await loading.present();

        try {
          await this.firebaseService.deleteEvent(this.event.uid);
          await loading.dismiss();
          this.utilsService.presentToast({
            message: 'Evento eliminado correctamente.',
            duration: 2000,
            color: 'success'
          });

          this.eventDeleted = true;
          this.dismissModal();
        } catch (error) {
          await loading.dismiss();
          this.utilsService.presentToast({
            message: 'Error al eliminar el evento.',
            duration: 2000,
            color: 'danger'
          });
          console.error(error);
        }
      }
    });
  }
}
