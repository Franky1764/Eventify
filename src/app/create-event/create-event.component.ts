import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular'; // Removido ToastController
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
// import { SqliteService } from '../services/sqlite.service'; // Si no se utiliza, remover esta línea
import { Event } from '../models/event.model';
import { UtilsService } from '../services/utils.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss'],
})
export class CreateEventComponent implements OnInit {
  eventForm: FormGroup;
  @Input() event?: Event; // Para recibir el evento a editar
  @Input() isEditing = false; // Para controlar si estamos editando

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private firebaseService: FirebaseService,
    // private sqliteService: SqliteService, // Remover si no se utiliza
    private utilsService: UtilsService // Importar UtilsService
  ) { }

  ngOnInit() {
    this.eventForm = this.formBuilder.group({
      uid: [this.event?.uid || ''], // Añadimos el uid al form
      sede: [this.event?.sede || '', Validators.required],
      tipoActividad: [this.event?.tipoActividad || '', Validators.required],
      tituloEvento: [this.event?.tituloEvento || '', Validators.required],
      fechaActividad: [this.event?.fechaActividad || '', Validators.required],
      horarioInicio: [this.event?.horarioInicio || '', Validators.required],
      horarioTermino: [this.event?.horarioTermino || '', Validators.required],
      dependencia: [this.event?.dependencia || '', Validators.required],
      modalidad: [this.event?.modalidad || '', Validators.required],
      docenteRepresentante: [this.event?.docenteRepresentante || ''],
      invitados: [this.event?.invitados || ''],
      directorParticipante: [this.event?.directorParticipante || ''],
      liderParticipante: [this.event?.liderParticipante || ''],
      subliderParticipante: [this.event?.subliderParticipante || ''],
      embajadores: [this.event?.embajadores || ''],
      inscritos: [this.event?.inscritos || ''],
      asistentesPresencial: [this.event?.asistentesPresencial || ''],
      asistentesOnline: [this.event?.asistentesOnline || ''],
      enlaces: [this.event?.enlaces || '']
    });

    // Si estamos editando, aseguramos que el uid se mantenga
    if (this.isEditing && this.event?.uid) {
      this.eventForm.get('uid').setValue(this.event.uid);
    }
  }

  async onSubmit() {
    if (this.eventForm.valid) {
      const loading = await this.utilsService.loading();
      await loading.present(); // Mostrar loading

      try {
        const formData = { ...this.eventForm.value };

        if (this.isEditing && this.event?.uid) {
          delete formData.uid;

          await this.firebaseService.updateEvent(this.event.uid, formData);
          await loading.dismiss(); // Ocultar loading
          this.utilsService.presentToast({
            message: 'Evento actualizado correctamente',
            duration: 2000,
            color: 'success'
          });

          this.modalController.dismiss({
            event: { ...formData, uid: this.event.uid },
            isEdit: true
          });
        } else {
          const docRef = await this.firebaseService.createEvent(formData);
          await loading.dismiss(); // Ocultar loading
          this.utilsService.presentToast({
            message: 'Evento creado correctamente',
            duration: 2000,
            color: 'success'
          });

          this.modalController.dismiss({
            event: { ...formData, uid: docRef.id },
            created: true
          });
        }
      } catch (error) {
        await loading.dismiss(); // Ocultar loading
        console.error('Error:', error);
        this.utilsService.presentToast({
          message: 'Error al procesar el evento',
          duration: 2000,
          color: 'danger'
        });
      }
    }
  }

  closeModal() {
    this.modalController.dismiss();
  }
}