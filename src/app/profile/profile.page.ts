import { Component, OnInit } from '@angular/core';
import { NavController, ModalController } from '@ionic/angular';
import { ProfileEditComponent } from '../components/profile-edit/profile-edit.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UserService } from '../services/user.service';
import { AppComponent } from '../app.component';
import { FirebaseService } from '../services/firebase.service';
import { User } from '../models/user.model';
import { SqliteService } from '../services/sqlite.service';

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
    private appComponent: AppComponent
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
      const photoUrl = await this.firebaseService.uploadImage(image.dataUrl, `profilePhotos/${this.user.uid}.jpg`);
      await this.userService.updateProfilePhoto(this.user.uid, photoUrl);
      this.user.profilePhoto = photoUrl;
      await this.sqliteService.updateUser(this.user);
    }
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

  logout() {
    this.appComponent.onLogout();
  }
}