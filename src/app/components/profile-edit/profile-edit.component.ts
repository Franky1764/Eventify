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
      
      try {
        const user = this.userService.user;
        if (!user?.uid) throw new Error('No user found');

        const datos = this.profileForm.value;
        const updatedUser = { ...this.profile, ...datos };

        // Primero actualizar SQLite
        await this.sqliteService.updateUser(updatedUser);
        
        // Intentar actualizar Firestore (manejará offline automáticamente)
        const isOnline = await this.firebaseSvc.updateUserInFirestore(updatedUser);
        
        loading.dismiss();
        
        const message = isOnline 
          ? 'Datos actualizados exitosamente.'
          : 'Datos guardados localmente. Se sincronizarán cuando haya conexión.';
        
        const alert = await this.alertController.create({
          header: 'Éxito',
          message: message,
          buttons: ['OK']
        });
        await alert.present();
        
        this.modalController.dismiss(datos);
      } catch (error) {
        loading.dismiss();
        console.error('Error updating profile:', error);
        
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'No se pudieron guardar los cambios',
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }
  
  close() {
    this.modalController.dismiss(); // Cerramos el modal sin pasar datos
  }
}