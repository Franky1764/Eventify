import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { passwordMatchValidator } from '../services/password-validator.service'; // Importamos validador de clave
import { AlertController } from '@ionic/angular'; // Importamos AlertController
import { Router } from '@angular/router'; // Importamos Router
import { User } from '../models/user.model'; // Importamos el modelo User
import { UtilsService } from '../services/utils.service';
import { FirebaseService } from '../services/firebase.service'; // Importamos FirebaseService

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {

  registerForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private alertController: AlertController, // Inyectamos AlertController
    private router: Router, // Inyectamos Router
    private utilsSvc: UtilsService, // Inyectamos UtilsService
    private firebaseSvc: FirebaseService, // Inyectamos FirebaseService
  ) {
    this.registerForm = this.formBuilder.group({
      uid: [''],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(4)]]
    }, { validators: passwordMatchValidator }); // Aplica el validador aquí
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      const user = this.registerForm.value;
      const username = this.registerForm.value.username;

      try {
        const userCredential = await this.firebaseSvc.signUp(user as User);
        const userId = userCredential.user?.uid;
        if (userId) {
          await this.firebaseSvc.updateUser(username);

          this.registerForm.get('uid')?.setValue(userId);
          await this.setUserInfo(userId);

          loading.dismiss();

          const alert = await this.alertController.create({
            message: 'Usuario creado exitosamente.',
            buttons: [{
              text: 'OK',
              handler: () => {
                this.router.navigate(['/login']);
              }
            }]
          });
          await alert.present();
        }
      } catch (err) {
        console.error('Error registering user', err);
        loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Hubo un problema al registrar el usuario. Por favor, inténtelo de nuevo.',
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  async setUserInfo(uid: string) {
    if (this.registerForm.valid) {


      const username = this.registerForm.value.username;

      let path = `users/${uid}`;
      delete this.registerForm.value.password;
      delete this.registerForm.value.confirmPassword;
      delete this.registerForm.value.uid;

      try {
        await this.firebaseSvc.setDocument(path, this.registerForm.value);
        await this.firebaseSvc.updateUser(username);
        this.utilsSvc.routerLink('/login');
        this.registerForm.reset();

      } catch (err) {
        console.log(err);
        this.utilsSvc.presentToast({
          message: err.message,
          duration: 3000,
          color: 'danger'
        })
      }
    }
  }
}