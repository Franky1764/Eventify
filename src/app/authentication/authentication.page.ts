import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service'; // Importamos FirebaseService
import { UtilsService } from '../services/utils.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SqliteService } from '../services/sqlite.service';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.page.html',
  styleUrls: ['./authentication.page.scss'],
})
export class AuthenticationPage {
  authForm: FormGroup;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private utilsSvc: UtilsService,
    private userService: UserService,
    private firebaseService: FirebaseService,
    private sqliteService: SqliteService // Importamos SqliteService
  ) {
    this.authForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(4)])
    });
  }

  async onSubmit() {
    if (this.authForm.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        const { email, password } = this.authForm.value;
        // Autenticar al usuario con Firebase
        const userCredential = await this.firebaseService.signIn(email, password);
        const userId = userCredential.user?.uid;

        if (userId) {
          // Obtener datos del usuario desde Firebase
          const userData = await this.firebaseService.getUserData(userId);
          
          if (userData) {
            // Si el usuario tiene una foto de perfil en Firebase Storage
            if (userData.profilePhoto) {
              // Usar directamente la URL almacenada en profilePhoto
              const imageBase64 = await this.firebaseService.downloadImageAsBase64(userData.profilePhoto);
              userData.profilePhotoData = imageBase64;
            }
            
            // Guardar datos del usuario en SQLite
            await this.sqliteService.addUser(userData);
            
            // Cargar usuario desde SQLite
            await this.userService.loadUser();

            // Navegar al Dashboard
            this.router.navigate(['/tabs/dashboard'], { replaceUrl: true });
          } else {
            this.showAlert('No se pudieron obtener los datos del usuario');
          }
        } else {
          this.showAlert('No se pudo obtener el ID del usuario');
        }
      } catch (error: any) {
        // Manejo de errores
        if (error.code === 'auth/user-not-found') {
          this.showAlert('Usuario no existe');
        } else if (error.code === 'auth/wrong-password') {
          this.showAlert('Clave incorrecta');
        } else {
          this.showAlert('Error de autenticación');
          this.utilsSvc.presentToast({
            message: error.message,
            duration: 3000,
            color: 'primary'
          });
        }
      } finally {
        loading.dismiss();
      }
    }
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Ups!',
      message,
      buttons: ['Reintentar']
    });
    await alert.present();
  }
}