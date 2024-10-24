import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { passwordMatchValidator } from '../services/password-validator.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { UtilsService } from '../services/utils.service';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {

  registerForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private router: Router,
    private utilsSvc: UtilsService,
    private firebaseSvc: FirebaseService,
  ) {
    this.registerForm = this.formBuilder.group({
      uid: [''],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(4)]]
    }, { validators: passwordMatchValidator });
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
          this.registerForm.get('uid')?.setValue(userId);

          let path = `users/${userId}`;
          delete this.registerForm.value.password;
          delete this.registerForm.value.confirmPassword;
          delete this.registerForm.value.uid;

          await this.firebaseSvc.setDocument(path, this.registerForm.value);

          await this.firebaseSvc.setDocument(`users/${userId}`, {
            username: user.username,
            email: user.email,
            nivel: 1,
            nombre: "",
            apellido: "",
            edad: "",
            whatsapp: "",
            carrera: "",
            sede: "",
            profilePhoto: ""
          });

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
}