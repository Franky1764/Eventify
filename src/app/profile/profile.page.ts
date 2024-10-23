import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { NavController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProfileEditComponent } from '../components/profile-edit/profile-edit.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FirebaseService } from '../services/firebase.service'; // Importa FirebaseService
import { User } from '../models/user.model';
import { SqliteService } from '../services/sqlite.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  profile: any = {};
  profileImage: any;
  user: User;

  constructor(
    private userService: UserService,
    private navCtrl: NavController,
    private modalController: ModalController,
    private router: Router,
    private firebaseService: FirebaseService,
    private sqliteService: SqliteService,
    private appComponent: AppComponent
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  async loadUser() {
    try {
      const userId = await this.firebaseService.getUserId();
      const user = await this.sqliteService.getUser(userId);
  
      if (user) {
        this.user = user;
        this.profile = this.user;
        this.router.navigate(['/tabs/dashboard']);
      } else {
        console.error('User not found in SQLite');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }


  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt // Permite al usuario elegir entre la cámara y la galería
    });
  
    if (image) {
      const userId = await this.firebaseService.getUserId(); // Usamos FirebaseService
      const photoUrl = await this.firebaseService.uploadImage(image.dataUrl, `profilePhotos/${userId}.jpg`);
      
      // Guardar la URL en SQLite
      await this.sqliteService.updateProfilePhoto(userId, photoUrl);
      
      // Actualizar la URL en Firestore
      await this.firebaseService.updateProfilePhoto(userId, photoUrl);
      
      // Actualizar la URL en el perfil
      this.profile.profilePhoto = photoUrl;
    }
  }

  updateProfilePhoto(userId: string, photoUrl: string) {
    this.userService.getUser(userId).subscribe((user: User) => {
      if (user) {
        // Actualiza directamente el campo profilePhoto en el objeto user
        const updatedUser = { ...user, profilePhoto: photoUrl };

        // Haz un patch con el objeto actualizado
        this.userService.updateUser(userId, updatedUser).then(() => {
          this.profile.profilePhoto = photoUrl;
        });
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  async openEditModal() {
    const modal = await this.modalController.create({
      component: ProfileEditComponent,
      componentProps: { profile: this.profile }
    });

    modal.onDidDismiss().then((data) => {
      if (data.data) {
        this.profile = data.data;
      }
    });

    return await modal.present();
  }

  async logout() {
    await this.appComponent.onLogout(); // Llama a la función onLogout de AppComponent
  }
}