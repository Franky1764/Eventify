import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isDatabaseReady: boolean = false;
  private firebaseService: FirebaseService;
  private authService: AuthService;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.initializeDatabase().catch(error => console.error('Failed to initialize database', error));
  }

  async waitForDatabaseReady(): Promise<void> {
    if (!this.isDatabaseReady) {
      await new Promise<void>(resolve => {
        const checkReady = () => {
          if (this.isDatabaseReady) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
  }

  private async initializeDatabase() {
    try {
      const platform = Capacitor.getPlatform();
      if (platform === 'web') {
        await customElements.whenDefined('jeep-sqlite');
        const jeepSqlite = document.querySelector('jeep-sqlite');
        if (jeepSqlite != null) {
          await this.sqlite.initWebStore();
        }
      }
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection('user_data', false)).result;
      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection('user_data', false);
      } else {
        this.db = await this.sqlite.createConnection('user_data', false, 'no-encryption', 1, false);
      }
      await this.db.open();
      await this.db.execute(`CREATE TABLE IF NOT EXISTS user_profile (id INTEGER PRIMARY KEY, profilePhoto TEXT)`);
      this.isDatabaseReady = true;
    } catch (error) {
      console.error('Error initializing database', error);
      this.isDatabaseReady = false;
    }
  }

  async getProfilePhoto(): Promise<string | null> {
    await this.waitForDatabaseReady();
    try {
      console.log('Attempting to get profile photo from SQLite');
      const result = await this.db.query('SELECT profilePhoto FROM user_profile LIMIT 1');
      const profilePhoto = result.values && result.values.length > 0 ? result.values[0].profilePhoto : null;
      console.log('Profile photo retrieved from SQLite:', profilePhoto);
      return profilePhoto;
    } catch (error) {
      console.error('Error getting profile photo', error);
      return null;
    }
  }
  
  async saveProfilePhoto(photoUrl: string): Promise<void> {
    if (!this.isDatabaseReady) {
      console.error('Database is not ready');
      return;
    }
    try {
      console.log('Attempting to save profile photo to SQLite:', photoUrl);
      const userId = await this.authService.getUserId();
      await this.db.run('INSERT OR REPLACE INTO user_profile (id, profilePhoto) VALUES (?, ?)', [userId, photoUrl]);
      console.log('Profile photo saved locally');
      
      // Sincronizar con Firebase en segundo plano
      this.firebaseService.updateProfilePhoto(userId, photoUrl).catch(error => {
        console.error('Error syncing profile photo with Firebase', error);
      });
    } catch (error) {
      console.error('Error saving profile photo', error);
    }
  }

  async deleteProfilePhoto(): Promise<void> {
    try {
      await this.db.run('DELETE FROM user_profile WHERE id = 1');
    } catch (error) {
      console.error('Error deleting profile photo', error);
    }
  }
}