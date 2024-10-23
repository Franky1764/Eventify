import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service'; // Importamos FirebaseService
import { SqliteService } from '../services/sqlite.service'; // Importamos SqliteService

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
    private navCtrl: NavController,
    private firebaseService: FirebaseService, // Usamos FirebaseService
    private sqliteService: SqliteService, // Usamos SqliteService
    private router: Router,
  ) {
    addIcons({ add });
  }

  async ngOnInit() {
    this.loadProfile(); 
  }

  async loadProfile() {
    try {
      const userId = await this.sqliteService.getUserIdFromSQLite();
      if (userId !== null) {
        const user = await this.sqliteService.getUser(userId);
        if (user) {
          this.profile = user;
          this.profile.profilePhoto = await this.sqliteService.getProfilePhoto(userId);
        } else {
          this.profile = {};
          console.error('User not found in SQLite');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  openCategoryDetails(categoryName: string) {
    this.navCtrl.navigateForward(`/category-details/${categoryName}`);
  }
}