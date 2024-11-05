import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, ToastOptions, AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router,
    private alertController: AlertController // Importamos AlertController
  ) { }

  loading() {
    return this.loadingCtrl.create({
      message: 'Cargando...',
      spinner: 'crescent'
    });
  }

  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);
    toast.present();
  }

  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }

  saveInLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value));
  }

  getFromLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key));
  }

  async presentConfirmAlert(options: {
    header: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmHandler: () => void;
  }): Promise<void> {
    const alert = await this.alertController.create({
      header: options.header,
      message: options.message,
      buttons: [
        {
          text: options.cancelText || 'Cancelar',
          role: 'cancel'
        },
        {
          text: options.confirmText || 'Aceptar',
          handler: options.confirmHandler
        }
      ]
    });

    await alert.present();
  }
}
