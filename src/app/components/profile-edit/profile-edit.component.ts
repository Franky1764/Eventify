import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, AlertController } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { SqliteService } from 'src/app/services/sqlite.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss']
})
export class ProfileEditComponent implements OnInit {
  @Input() profile: any; // Recibimos el perfil como input
  profileForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController, 
    private alertController: AlertController,
    private utilsSvc: UtilsService,
    private firebaseSvc: FirebaseService,
    private sqliteService: SqliteService,
    private userService: UserService
  ) {
    this.profileForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', Validators.required],
      whatsapp: ['', Validators.required],
      carrera: ['', Validators.required],
      sede: ['', Validators.required],
      profilePhoto: ['']
    });
  }

  ngOnInit(): void {
    if (this.profile) {
      this.profileForm.patchValue(this.profile); 
    }
  }

  async save() {
    if (this.profileForm.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      const user = this.userService.user;
      if (user && user.uid) {
        const datos = this.profileForm.value;
        try {
          // Actualiza los datos en SQLite
          await this.sqliteService.updateUser({ ...this.profile, ...datos });
          loading.dismiss();
          console.log('Usuario actualizado');
          const alert = await this.alertController.create({
            header: 'Éxito',
            message: 'Datos actualizados exitosamente.',
            buttons: ['OK']
          });
          await alert.present();
          this.modalController.dismiss(datos); 
        } catch (error) {
          loading.dismiss();
          console.error('Error al actualizar el usuario', error);
        }
      } else {
        console.error('No hay usuario logueado');
      }
    } else {
      console.error('Formulario inválido');
    }
  }
  
  close() {
    this.modalController.dismiss(); // Cerramos el modal sin pasar datos
  }
}