import { Component, OnInit } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { StorageService } from './services/storage.service';
import { Router } from '@angular/router';
import { UserService } from './services/user.service';
import { FirebaseService } from './services/firebase.service';
import { SqliteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public isWeb: boolean;
  public load: boolean;

  constructor(
    private platform: Platform,
    private sqlite: SqliteService,
    private storageService: StorageService,
    private router: Router,
    private userService: UserService,
    private firebaseSvc: FirebaseService,
    private sqliteService: SqliteService
  ) {
    this.isWeb = false;
    this.load = false;
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then( async () => {
      const info = await Device.getInfo();
      this.isWeb = info.platform === 'web';
      this.sqlite.init();
      this.sqlite.dbReady.subscribe(load => {
        this.load = load;
      })
      this.checkSession();
    });
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
      await this.userService.logoutUser(session.userId);
    }
    await this.storageService.clearSession(); // Eliminar la sesión activa
    this.router.navigate(['/']);
  }

  ngOnInit() {}
}