import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss'],
})
export class CreateEventComponent implements OnInit {
  @Input() event: any; 
  eventForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.eventForm = this.formBuilder.group({
      sede: ['', Validators.required],
      tipoActividad: ['', Validators.required],
      tituloEvento: ['', Validators.required],
      fechaActividad: ['', Validators.required],
      horarioInicio: ['', Validators.required],
      horarioTermino: ['', Validators.required],
      dependencia: ['', Validators.required],
      modalidad: ['', Validators.required],
      docenteRepresentante: [''],
      invitados: [''],
      directorParticipante: [''],
      liderParticipante: [''],
      subliderParticipante: [''],
      embajadores: [''],
      inscritos: [''],
      asistentesPresencial: [''],
      asistentesOnline: [''],
      enlaces: ['']
    });

    // Si estamos editando, llenamos el formulario con los valores del evento
    if (this.event) {
      this.eventForm.patchValue(this.event);
    }
  }

  // Método para manejar el envío del formulario
  async onSubmit() {
    console.log("onSubmit triggered");
    console.log (this.eventForm.value);
    console.log (this.eventForm.valid);

    if (this.eventForm.valid) {
      if (this.event) {
        // Si estamos editando
        await this.firebaseService.updateEvent(this.event.uid, this.eventForm.value);
        this.showToast('Evento actualizado correctamente.');
      } else {
        // Si estamos creando
        await this.firebaseService.createEvent(this.eventForm.value);
        this.showToast('Evento creado con éxito.');
      }
      this.closeModal();
    } else {
      this.showToast('Por favor, completa todos los campos.');
    }
  }

  closeModal() {
    this.modalController.dismiss();
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }
}
