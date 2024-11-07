import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from './services/firebase.service';
import { UserService } from './services/user.service';
import { SqliteService } from './services/sqlite.service'; // Importa SqliteService
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private firebaseSvc: FirebaseService,
    private userService: UserService,
    private sqliteService: SqliteService, // Inyecta SqliteService
    private router: Router
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    SplashScreen.hide();
    // Inicializa el plugin SQLite antes de cualquier otra operación
    await this.sqliteService.initializePlugin();
    this.checkAuthentication();
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
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}