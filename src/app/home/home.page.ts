import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {

  constructor(private navCtrl: NavController) {}

  // Este es el método que faltaba para la navegación
  goToAuthentication() {
    this.navCtrl.navigateForward('/login');
  }
}
