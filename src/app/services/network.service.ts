// network.service.ts
import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';
import { UtilsService } from './utils.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private isOnline = new BehaviorSubject<boolean>(true);
  public online$ = this.isOnline.asObservable();

  constructor(
    private utilsSvc: UtilsService,
    private firebaseSvc: FirebaseService
  ) {
    this.initNetworkListener();
  }

  private async initNetworkListener() {
    // Estado inicial
    const status = await Network.getStatus();
    this.isOnline.next(status.connected);

    // Listener de cambios
    Network.addListener('networkStatusChange', async (status) => {
      this.isOnline.next(status.connected);
      if (status.connected) {
        await this.handleConnectionRestored();
      }
    });
  }

  private async handleConnectionRestored() {
    if (this.firebaseSvc.hasPendingUpdates()) {
      const loading = await this.utilsSvc.loading();
      loading.message = 'Sincronizando datos...';
      await loading.present();

      try {
        await this.firebaseSvc.syncPendingUpdates();
      } finally {
        await loading.dismiss();
      }
    }
  }
}
