import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { CreateEventComponent } from './create-event/create-event.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';

import { TabsComponent } from './tabs/tabs.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';

// Importar IonicStorageModule
import { IonicStorageModule } from '@ionic/storage-angular';

import { StorageService } from './services/storage.service';
import { DatabaseService } from './services/database.service';

@NgModule({
  declarations: [TabsComponent, AppComponent, CreateEventComponent, ProfileEditComponent], 
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // Configurar IonicStorageModule
    IonicStorageModule.forRoot()
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    StorageService,
    DatabaseService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}