import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
  }

  // Guardar estado de sesión
  async setSession(session: any) {
    await this.storage.set('session', JSON.stringify(session));
  }

  // Recuperar estado de sesión
  async getSession() {
    const sessionData = await this.storage.get('session');
    return sessionData ? JSON.parse(sessionData) : null;
  }

  // Eliminar estado de sesión
  async clearSession() {
    this.storage.remove('session');
  }
}