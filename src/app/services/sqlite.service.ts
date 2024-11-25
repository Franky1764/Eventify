import { Injectable, signal, WritableSignal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { User } from '../models/user.model';
import { FirebaseService } from './firebase.service';

const DB_NAME = 'app.db';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isInitialized = false;
  private users: WritableSignal<User[]> = signal<User[]>([]);

  constructor(private firebaseSvc: FirebaseService) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializePlugin() {
    if (this.isInitialized) {
      return true;
    }

    try {
      if (Capacitor.getPlatform() === 'web') {
        console.log('Inicializando SQLite en modo web');
        await this.sqlite.initWebStore();
      }

      await this.openDatabase();
      this.isInitialized = true;
      console.log('Plugin SQLite inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar el plugin SQLite:', error);
      return false;
    }
  }

  private async openDatabase() {
    try {
      this.db = await this.sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();
      await this.createSchema();
      await this.loadUsers();
    } catch (error) {
      console.error('Error al abrir la base de datos:', error);
      throw error;
    }
  }

  private async createSchema() {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        nivel INTEGER,
        nombre TEXT,
        apellido TEXT,
        edad INTEGER,
        whatsapp TEXT,
        carrera TEXT,
        sede TEXT,
        profilePhoto TEXT,
        profilePhotoData TEXT
      );
    `;
    await this.db.execute(schema);
  }

  // OBTENER datos del usuario
  getUser() {
    return this.users.asReadonly(); // Devuelve un ReadableSignal
  }

  // CRUD USERS
  async loadUsers() {
    try {
      const users = await this.db.query(`SELECT * FROM users`);
      this.users.set(users.values || []);
    } catch (error) {
      console.error('Error al cargar los usuarios:', error);
    }
  }

  async getUserById(uid: string) {
    const query = `SELECT * FROM users WHERE uid = ?`;
    const res = await this.db.query(query, [uid]);
    const user = res.values.length > 0 ? res.values[0] : null;
    if (user) {
      this.users.set([user]); // Actualiza el WritableSignal con el usuario encontrado
    }
    return user;
  }

  async addUser(data: User) {
    const existingUser = await this.getUserById(data.uid);
    const query = existingUser
      ? `UPDATE users SET 
          username = ?, email = ?, nivel = ?, nombre = ?, apellido = ?, edad = ?, whatsapp = ?, carrera = ?, sede = ?, profilePhoto = ?, profilePhotoData = ?
        WHERE uid = ?`
      : `INSERT INTO users (
          uid, username, email, nivel, nombre, apellido, edad, whatsapp, carrera, sede, profilePhoto, profilePhotoData
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = existingUser
      ? [data.username, data.email, data.nivel, data.nombre, data.apellido, data.edad, data.whatsapp, data.carrera, data.sede, data.profilePhoto, data.profilePhotoData, data.uid]
      : [data.uid, data.username, data.email, data.nivel, data.nombre, data.apellido, data.edad, data.whatsapp, data.carrera, data.sede, data.profilePhoto, data.profilePhotoData];

    await this.db.run(query, values);
    await this.loadUsers();
  }

  async updateUser(user: User) {
    const query = `
      UPDATE users SET 
        username = ?, email = ?, nivel = ?, nombre = ?, apellido = ?, edad = ?, whatsapp = ?, carrera = ?, sede = ?, profilePhoto = ?, profilePhotoData = ?
      WHERE uid = ?
    `;
    const values = [
      user.username, user.email, user.nivel, user.nombre, user.apellido, user.edad, user.whatsapp, user.carrera, user.sede, user.profilePhoto, user.profilePhotoData, user.uid
    ];
    const result = await this.db.run(query, values);
    await this.firebaseSvc.updateUserInFirestore(user);
    await this.loadUsers();
    return result;
  }

  async deleteUserById(uid: string) {
    const query = `DELETE FROM users WHERE uid = '${uid}'`;
    const result = await this.db.run(query);
    this.loadUsers();
    return result;
  }

  // OBTENER PROFILEPHOTO DEL USER DESDE LA BASE DE DATOS LOCAL
  async getProfilePhoto(uid: string) {
    const query = `SELECT profilePhoto FROM users WHERE uid = '${uid}'`;
    const result = await this.db.run(query);
    return result;
  }

  // ACTUALIZAR PROFILEPHOTO DEL USER EN LA BASE DE DATOS LOCAL
  async updateProfilePhoto(uid: string, photoUrl: string) {
    const query = `UPDATE users SET profilePhoto = '${photoUrl}' WHERE uid = '${uid}'`;
    await this.db.run(query);
  }
}