import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Platform, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  user: User | undefined;

  categories = [
    { name: 'Talleres', icon: 'construct-outline' },
    { name: 'Desafíos', icon: 'ribbon-outline' },
    { name: 'Mentorías', icon: 'people-circle-outline' },
    { name: 'Charlas', icon: 'mic-outline' },
    { name: 'Stands', icon: 'megaphone-outline' }
  ];

  constructor(
    private platform: Platform,
    private router: Router,
    private userService: UserService,
    private loadingController: LoadingController
  ) {
    // Manejar el botón "Atrás" en dispositivos móviles
    this.platform.backButton.subscribeWithPriority(10, () => {
      // No realizar ninguna acción al presionar "Atrás" en el dashboard
    });
    addIcons({ add });
  }

  async ngOnInit() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();

    try {
      // Cargar los datos del usuario desde el servicio
      await this.userService.loadUser();
      this.user = this.userService.user;
      console.log('Usuario cargado:', this.user);
    } catch (error) {
      console.error('Error al cargar el usuario:', error);
    } finally {
      await loading.dismiss();
    }
  }

  openCategoryDetails(categoryName: string) {
    // Normalizar el nombre de la categoría para la URL
    const formattedCategoryName = categoryName.replace(/\s+/g, '-').toLowerCase();
    this.router.navigate([`/category-details/${formattedCategoryName}`]);
  }
}
