import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { CapacitorSQLite, JsonSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { FirebaseService } from './firebase.service';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { User } from '../models/user.model';
import { UserService } from './user.service'; // Importa UserService

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection;
  private injector: Injector;
  private _firebaseService: FirebaseService;
  private _userService: UserService; // Añadimos una propiedad para UserService

  // Observable para comprobar si la base de datos esta lista
  public dbReady: BehaviorSubject<boolean>;
  // Indica si estamos en web
  public isWeb: boolean;
  // Indica si estamos en IOS
  public isIOS: boolean;
  // Nombre de la base de datos
  public dbName: string;

  constructor(
    injector: Injector,
    private http: HttpClient
  ) {
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIOS = false;
    this.dbName = '';
    this.injector = injector;
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.init();
  }

  private get firebaseService(): FirebaseService {
    if (!this._firebaseService) {
      this._firebaseService = this.injector.get(FirebaseService);
    }
    return this._firebaseService;
  }

  private get userService(): UserService {
    if (!this._userService) {
      this._userService = this.injector.get(UserService);
    }
    return this._userService;
  }

  async init() {
    const info = await Device.getInfo();

    const sqlite = CapacitorSQLite as any;

    if (info.platform == 'android') {
      try {
        await sqlite.requestPermissions();
      } catch (error) {
        console.error("Esta app necesita permisos para funcionar")
      }
      // Si estamos en web, iniciamos la web store
    } else if (info.platform == 'web') {
      this.isWeb = true;
      await sqlite.initWebStore();
    } else if (info.platform == 'ios') {
      this.isIOS = true;
    }

    // Arrancamos la base de datos
    await this.setupDatabase();
  }

  async setupDatabase() {
    // Obtenemos si ya hemos creado la base de datos
    const dbSetup = await Preferences.get({ key: 'first_setup_key' });

    // Sino la hemos creado, descargamos y creamos la base de datos
    if (!dbSetup.value) {
      await this.downloadDatabase();
    } else {
      // Nos volvemos a conectar
      this.dbName = await this.getDbName();
      this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      await this.db.open();
      await this.createTables(); // Asegurarse de que las tablas se creen
      this.dbReady.next(true);
    }
  }

  async downloadDatabase() {
    // Obtenemos el fichero assets/db/db.json
    this.http.get('assets/db/db.json').subscribe(async (jsonExport: JsonSQLite) => {
      const jsonstring = JSON.stringify(jsonExport);
      // Validamos el objeto
      const isValid = await CapacitorSQLite.isJsonValid({ jsonstring });

      // Si es valido
      if (isValid.result) {
        // Obtengo el nombre de la base de datos
        this.dbName = jsonExport.database;
        // Lo importo a la base de datos
        await CapacitorSQLite.importFromJson({ jsonstring });
        // Creo y abro una conexion a sqlite
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
        await this.db.open();
        await this.createTables(); // Asegurarse de que las tablas se creen

        // Marco que ya hemos descargado la base de datos
        await Preferences.set({ key: 'first_setup_key', value: '1' });
        // Guardo el nombre de la base de datos
        await Preferences.set({ key: 'dbname', value: this.dbName });

        // Indico que la base de datos esta lista
        this.dbReady.next(true);
      }
    });
  }

  async getDbName() {
    if (!this.dbName) {
      const dbname = await Preferences.get({ key: 'dbname' });
      if (dbname.value) {
        this.dbName = dbname.value;
      }
    }
    return this.dbName;
  }

  async createTables() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        password TEXT,
        nivel INTEGER,
        nombre TEXT,
        apellido TEXT,
        edad INTEGER,
        whatsapp TEXT,
        carrera TEXT,
        sede TEXT,
        profilePhoto TEXT,
        sql_deleted INTEGER,
        last_modified INTEGER
      );
    `;
    try {
      await this.db.execute(query);
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async saveEvent(event: any) {
    const query = `
      INSERT INTO events (
        uid, sede, tipoActividad, tituloEvento, fechaActividad, horarioInicio, horarioTermino, 
        dependencia, modalidad, docenteRepresentante, invitados, directorParticipante, 
        liderParticipante, subliderParticipante, embajadores, inscritos, asistentesPresencial, 
        asistentesOnline, enlaces, sql_deleted, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, strftime('%s', 'now'));
    `;

    const values = [
      event.uid,
      event.sede,
      event.tipoActividad,
      event.tituloEvento,
      event.fechaActividad,
      event.horarioInicio,
      event.horarioTermino,
      event.dependencia,
      event.modalidad,
      event.docenteRepresentante,
      event.invitados,
      event.directorParticipante,
      event.liderParticipante,
      event.subliderParticipante,
      event.embajadores,
      event.inscritos,
      event.asistentesPresencial,
      event.asistentesOnline,
      event.enlaces
    ];

    try {
      await this.db.run(query, values);
      console.log('Event saved successfully');
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }

  async saveUser(user: User) {
    const query = `
      INSERT OR REPLACE INTO users (
        uid, username, email, password, nivel, nombre, apellido, edad, whatsapp, carrera, sede, profilePhoto, sql_deleted, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, strftime('%s', 'now'));
    `;
  
    const values = [
      user.uid,
      user.username,
      user.email,
      user.password,
      user.nivel,
      user.nombre,
      user.apellido,
      user.edad,
      user.whatsapp,
      user.carrera,
      user.sede,
      user.profilePhoto
    ];
  
    try {
      await this.db.run(query, values);
      console.log('User saved successfully');
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async getUser(userId: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE uid = ?`;
    try {
      const result = await this.db.query(query, [userId]);
      if (result.values.length > 0) {
        return result.values[0] as User;
      } else {
        console.error('User not found');
        return null;
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getProfilePhoto(userId: string): Promise<string> {
    const query = `SELECT profilePhoto FROM users WHERE uid = ?`;
    try {
      const result = await this.db.query(query, [userId]);
      if (result.values.length > 0) {
        return result.values[0].profilePhoto;
      } else {
        console.error('Profile photo not found in SQLite');
        return '';
      }
    } catch (error) {
      console.error('Error getting profile photo:', error);
      return '';
    }
  }

  async updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    const query = `UPDATE users SET profilePhoto = ? WHERE uid = ?`;
    try {
      await this.db.run(query, [photoUrl, userId]);
      console.log('Profile photo updated successfully in SQLite');
    } catch (error) {
      console.error('Error updating profile photo in SQLite:', error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const query = `DELETE FROM users WHERE uid = ?`;
    try {
      await this.db.run(query, [userId]);
      console.log(`User with ID ${userId} deleted successfully from SQLite`);
    } catch (error) {
      console.error(`Error deleting user with ID ${userId} from SQLite:`, error);
    }
  }

  async updateUserInfo(userId: string, datos: any): Promise<void> {
    const query = `
      UPDATE users SET 
        nombre = ?, 
        apellido = ?, 
        edad = ?, 
        whatsapp = ?, 
        carrera = ?, 
        sede = ? 
      WHERE uid = ?;
    `;

    const values = [
      datos.nombre,
      datos.apellido,
      datos.edad,
      datos.whatsapp,
      datos.carrera,
      datos.sede,
      userId
    ];

    try {
      await this.db.run(query, values);
      console.log('User info updated successfully in SQLite');
      await this.userService.updateUser(userId, datos);
      console.log('User info updated successfully in Firestore');
    } catch (error) {
      console.error('Error updating user info in SQLite:', error);
    }
  }

  async getUserIdFromSQLite(): Promise<string | null> {
    const query = `SELECT uid FROM users LIMIT 1`;
    try {
      const result = await this.db.query(query);
      if (result.values.length > 0) {
        return result.values[0].uid;
      } else {
        console.error('User ID not found in SQLite');
        return null;
      }
    } catch (error) {
      console.error('Error getting user ID from SQLite:', error);
      return null;
    }
  }
}