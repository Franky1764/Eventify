import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StorageService } from './services/storage.service';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  profilePhoto: string;

  constructor(
    private platform: Platform,
    private storageService: StorageService,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.checkSession();
    });
  }

  async checkSession() {
    const session = await this.storageService.getSession();
    setTimeout(async () => {
      if (session && session.userId) {
        this.authService.setUserId(session.userId);
        await this.loadProfilePhoto(session.userId);
        this.router.navigate(['/tabs/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }, 100);
  }

  async loadProfilePhoto(userId: string) {
    this.profilePhoto = await this.userService.loadProfilePhoto();
    if (!this.profilePhoto) {
      await this.userService.syncProfilePhoto(userId);
      this.profilePhoto = await this.userService.loadProfilePhoto();
    }
  }

  async onLogout() {
    await this.userService.clearProfilePhoto();
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  ngOnInit() {}
}