import { Component, OnInit } from '@angular/core';
import { StorageService } from './services/storage.service';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';
import { FirebaseService } from './services/firebase.service';
import { SqliteService } from './services/sqlite.service';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  constructor(
    private storageService: StorageService,
    private router: Router,
    private firebaseSvc: FirebaseService,
    private sqliteService: SqliteService,
    private userService: UserService
  ) {
    this.initApp();
  }

  async initApp() {
    await this.sqliteService.initializePlugin();
    SplashScreen.hide();
  }

  async checkSession() {
    const session = await this.storageService.getSession();
    setTimeout(async () => {
      if (session && session.userId) {
        const currentUser = await this.firebaseSvc.getUserId();
        if (currentUser === session.userId) {
          this.router.navigate(['/tabs/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    }, 100);
  }

  async onLogout() {
    const session = await this.storageService.getSession();
    if (session && session.userId) {
      await this.userService.logout();
    }
    await this.storageService.clearSession(); // Eliminar la sesión activa
    this.router.navigate(['/']);
  }

  ngOnInit() {}
}