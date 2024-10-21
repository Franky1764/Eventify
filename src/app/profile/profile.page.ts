import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProfileEditComponent } from '../components/profile-edit/profile-edit.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FirebaseService } from '../services/firebase.service'; // Importa FirebaseService
import { User } from '../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  profile: any = {};
  profileImage: any;

  constructor(
    private userService: UserService,
    private navCtrl: NavController,
    private authService: AuthService,
    private modalController: ModalController,
    private router: Router,
    private firebaseService: FirebaseService // Inyecta FirebaseService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    const userId = await this.authService.getUserId(); 
  
    if (userId !== null) {
      this.userService.getUser(userId).subscribe(async (data: any) => {
        this.profile = data?.datos[0] || {};
        this.profile.profilePhoto = await this.userService.loadProfilePhoto();
      });
    } else {
      console.error('No se encontró un userId válido');
      this.profile = {};
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
      const userId = await this.authService.getUserId();
      const photoUrl = await this.firebaseService.uploadImage(image.dataUrl, `profilePhotos/${userId}.jpg`);
      this.updateProfilePhoto(userId, photoUrl);
    }
  }

  updateProfilePhoto(userId: string, photoUrl: string) {
    this.userService.getUser(userId).subscribe((user: User) => {
      if (user && user.datos && user.datos.length > 0) {
        // Clona el objeto datos para evitar mutaciones no deseadas
        const updatedDatos = { ...user.datos[0], profilePhoto: photoUrl };
  
        // Haz un patch con el objeto completo de datos
        this.userService.updateUser(userId, { datos: [updatedDatos] }).then(() => {
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
    await this.authService.logout(); // Llamar al método logout de AuthService
    this.router.navigate(['/login']);
  }
}