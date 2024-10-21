import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  categories = [
    { name: 'Talleres', icon: 'construct-outline' },
    { name: 'Desafíos', icon: 'ribbon-outline' },
    { name: 'Mentorías', icon: 'people-circle-outline' },
    { name: 'Charlas', icon: 'mic-outline' },
    { name: 'Stands', icon: 'megaphone-outline' }
  ];

  profile: any = {}; 

  constructor(
    private modalController: ModalController,
    private navCtrl: NavController,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ add });
  }

  async ngOnInit() {
    this.loadProfile(); 
  }

  async loadProfile() {
    const userId = await this.authService.getUserId();
    if (userId !== null) {
      this.userService.getUser(userId).subscribe(async (data: any) => {
        if (data && data.datos && data.datos.length > 0) {
          this.profile = data.datos[0];
          this.profile.profilePhoto = await this.userService.loadProfilePhoto();
        } else {
          this.profile = {};
        }
      });
    }
  }

  openCategoryDetails(categoryName: string) {
    this.navCtrl.navigateForward(`/category-details/${categoryName}`);
  }
}
