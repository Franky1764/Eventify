import { Component, OnInit } from '@angular/core';
import { NavController, ModalController } from '@ionic/angular';
import { ProfileEditComponent } from '../components/profile-edit/profile-edit.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UserService } from '../services/user.service';
import { AppComponent } from '../app.component';
import { FirebaseService } from '../services/firebase.service';
import { User } from '../models/user.model';
import { SqliteService } from '../services/sqlite.service';
import { UtilsService } from '../services/utils.service';
import { ViewPhotoComponent } from '../components/view-photo/view-photo.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: User | undefined;

  constructor(
    private userService: UserService,
    private sqliteService: SqliteService,
    private firebaseService: FirebaseService,
    private navCtrl: NavController,
    private modalController: ModalController,
    private appComponent: AppComponent,
    private utilsService: UtilsService
  ) {}

  async ngOnInit() {
    this.user = this.userService.user;
    if (!this.user) {
      await this.userService.loadUser();
      this.user = this.userService.user;
    }
  }

  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt
    });

    if (image && this.user) {
      const loading = await this.utilsService.loading();
      await loading.present();
      try {
        // Redimensionar la imagen antes de subirla
        const resizedImage = await this.resizeImage(image.dataUrl, 800, 800);

        const photoUrl = await this.firebaseService.uploadImage(resizedImage, `profilePhotos/${this.user.uid}.jpg`);
        await this.userService.updateProfilePhoto(this.user.uid, photoUrl);
        this.user.profilePhoto = photoUrl;
        await this.sqliteService.updateUser(this.user);
      } catch (error) {
        console.error('Error procesando la imagen:', error);
      } finally {
        loading.dismiss();
      }
    }
  }

  private async resizeImage(dataUrl: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Mantener proporción
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);
          width = width * ratio;
          height = height * ratio;
        }

        // Redimensionar usando canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a DataURL con calidad ajustada
        const newDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(newDataUrl);
      };
      img.onerror = (err) => {
        console.error('Error cargando la imagen:', err);
        resolve(dataUrl); // Devuelve la imagen original en caso de error
      };
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  async openEditModal() {
    if (this.user) {
      const modal = await this.modalController.create({
        component: ProfileEditComponent,
        componentProps: { profile: this.user }
      });

      modal.onDidDismiss().then(async (data) => {
        if (data.data) {
          this.userService.user = data.data;
          await this.userService.loadUser();
          this.user = this.userService.user;
        }
      });

      return await modal.present();
    } else {
      console.error('No user found');
    }
  }

  async viewPhoto() {
    if (this.user && this.user.profilePhoto) {
      const modal = await this.modalController.create({
        component: ViewPhotoComponent,
        componentProps: { photoUrl: this.user.profilePhoto },
        cssClass: 'transparent-modal'
      });
      return await modal.present();
    }
  }

  logout() {
    this.appComponent.onLogout();
  }
}