import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  user: User | undefined;

  categories = [
    { name: 'Talleres', icon: 'construct-outline' },
    { name: 'Desafios', icon: 'ribbon-outline' },
    { name: 'Mentorias', icon: 'people-circle-outline' },
    { name: 'Charlas', icon: 'mic-outline' },
    { name: 'Stands', icon: 'megaphone-outline' }
  ];

  constructor(
    private platform: Platform,
    private router: Router,
    private userService: UserService
  ) {
    this.platform.backButton.subscribeWithPriority(10, () => {
      // No hacer nada al presionar el botón atrás
    });
    addIcons({ add });
  }

  async ngOnInit() {
    await this.userService.loadUser();
    this.user = this.userService.user;
    console.log(this.user);
  }

  openCategoryDetails(categoryName: string) {
    this.router.navigate([`/tabs/dashboard/${categoryName.toLowerCase()}`]);
  }
}