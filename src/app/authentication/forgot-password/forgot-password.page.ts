import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  form: FormGroup;

  constructor(
    private router: Router,
    private firebaseSvc: FirebaseService,
    private utilsSvc: UtilsService
  ) {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        await this.firebaseSvc.resetPassword(this.form.value.email);
        this.utilsSvc.presentToast({
          message: 'Correo enviado con éxito',
          duration: 3000,
          color: 'success',
        });
        this.router.navigate(['/login']);
      } catch (error: any) {
        console.error('Error en onSubmit:', error);
        let message = 'Error al enviar el correo';
        if (error.code === 'auth/user-not-found') {
          message = 'Correo no registrado';
        } else if (error.code === 'permission-denied') {
          message = 'Permisos insuficientes para realizar esta acción';
        }
        this.utilsSvc.presentToast({
          message,
          duration: 3000,
          color: 'danger',
        });
      } finally {
        loading.dismiss();
      }
    }
  }
}