import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service'; // Importamos FirebaseService
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private firebaseService: FirebaseService, // Usamos FirebaseService
    private router: Router,
    private storageService: StorageService
  ) {}

  async canActivate(): Promise<boolean> {
    const session = await this.storageService.getSession();
    if (session && session.userId) {
      const currentUser = await this.firebaseService.getUserId();
      if (currentUser === session.userId) {
        return true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}