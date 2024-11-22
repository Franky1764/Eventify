import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FirebaseService } from './services/firebase.service';
import { UserService } from './services/user.service';
import { SqliteService } from './services/sqlite.service';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { ToastController } from '@ionic/angular';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private firebaseSvc: FirebaseService,
    private userService: UserService,
    private sqliteService: SqliteService,
    private router: Router,
    private toastController: ToastController,
    private storageService: StorageService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    try {
      await this.platform.ready();
      SplashScreen.hide();
      
      const initialized = await this.sqliteService.initializePlugin();
      if (!initialized) {
        console.error('Error al inicializar SQLite');
        return;
      }

      this.checkAuthentication();
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
    }
  }

  checkAuthentication() {
    this.firebaseSvc.getAuthState().subscribe(async user => {
      if (user) {
        console.log('Usuario autenticado:', user.uid);
        await this.userService.loadUser(); // Cargar usuario desde SQLite
        this.router.navigate(['/tabs/dashboard'], { replaceUrl: true });
      } else {
        console.log('No hay usuario autenticado');
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  async onLogout() {
    await this.firebaseSvc.signOut();
    await this.userService.logout();
    await this.storageService.clearSession(); // Eliminar la sesión activa
    this.router.navigate(['/login'], { replaceUrl: true });

    // Mostrar notificación al usuario
    const toast = await this.toastController.create({
      message: 'Sesión cerrada exitosamente.',
      duration: 2000,
      position: 'bottom',
      color: 'success' 
    });
    await toast.present();
  }
}