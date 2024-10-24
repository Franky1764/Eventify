import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service'; // Importamos FirebaseService
import { UtilsService } from '../services/utils.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

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
    private firebaseService: FirebaseService, // Inyectamos FirebaseService
    private utilsSvc: UtilsService
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
        await this.firebaseService.signIn({ email, password } as User);

        // Redirigir a la página de Dashboard
        this.router.navigate(['/tabs/dashboard']);
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          this.showAlert('Usuario no existe');
        } else if (error.code === 'auth/invalid-credential') {
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