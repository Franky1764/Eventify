import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule} from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';

// Importación de Componentes
import { CreateEventComponent } from './create-event/create-event.component';
import { AppComponent } from './app.component';
import { TabsComponent } from './tabs/tabs.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { ViewPhotoComponent } from './components/view-photo/view-photo.component';

// Importar IonicStorageModule
import { IonicStorageModule } from '@ionic/storage-angular';

// Importación de Servicios
import { StorageService } from './services/storage.service';
import { DatabaseService } from './services/database.service';
import { FirebaseService } from './services/firebase.service';
// Modulos de Firestore
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';
//jeep/capacitor
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';


jeepSqlite(window);
@NgModule({
  declarations: [TabsComponent, AppComponent, CreateEventComponent, ProfileEditComponent, EventDetailComponent, ViewPhotoComponent], 
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // Configurar IonicStorageModule
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule.enablePersistence() // Inicializar Firebase
  ],
  providers: [
    FirebaseService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    StorageService,
    DatabaseService
  ],
  bootstrap: [AppComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]

})
export class AppModule {}