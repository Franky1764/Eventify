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
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private users: WritableSignal<User[]> = signal<User[]>([]);

  constructor(private firebaseSvc: FirebaseService) { }

  async initializePlugin() {
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.initWebStore();
    }
    this.db = await this.sqlite.createConnection(
      DB_NAME,
      false,
      "no-encryption",
      1,
      false
    );
    await this.db.open();

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
        profilePhoto TEXT
      );
    `;

    await this.db.execute(schema);
    this.loadUsers();
    return true;
  }

  // OBTENER datos del usuario
  getUser() {
    return this.users;
  }

  // CRUD operations
  async loadUsers() {
    const users = await this.db.query(`SELECT * FROM users`);
    this.users.set(users.values || []);
  }

  async getUserById(uid: string) {
    const query = `SELECT * FROM users WHERE uid = '${uid}'`;
    const res = await this.db.query(query);
    const user = res.values.length > 0 ? res.values[0] : null;
    if (user) {
      this.users.set([user]); // Actualiza el WritableSignal con el usuario encontrado
    }
    return user;
  }

  async addUser(data: any) {
    const existingUser = await this.getUserById(data.uid);
    if (existingUser) {
      // If user exists, update it
      const query = `
        UPDATE users SET 
          username = ?, email = ?, nivel = ?, nombre = ?, apellido = ?, edad = ?, whatsapp = ?, carrera = ?, sede = ?, profilePhoto = ?
        WHERE uid = ?
      `;
      const values = [
        data.username, data.email, data.nivel, data.nombre, data.apellido, data.edad, data.whatsapp, data.carrera, data.sede, data.profilePhoto, data.uid
      ];
      const result = await this.db.run(query, values);
      this.loadUsers();
      return result;
    } else {
      const query = `
        INSERT INTO users (
          uid, username, email, nivel, nombre, apellido, edad, whatsapp, carrera, sede, profilePhoto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        data.uid, data.username, data.email, data.nivel, data.nombre, data.apellido, data.edad, data.whatsapp, data.carrera, data.sede, data.profilePhoto
      ];
      const result = await this.db.run(query, values);
      this.loadUsers();
      return result;
    }
  }

  async updateUser(user: User) {
    const query = `
      UPDATE users SET 
        nombre = ?, apellido = ?, edad = ?, whatsapp = ?, carrera = ?, sede = ?
      WHERE uid = ?
    `;
    const values = [
      user.nombre, user.apellido, user.edad, user.whatsapp, user.carrera, user.sede, user.uid
    ];
    const result = await this.db.run(query, values);
    this.loadUsers();
    // Actualiza los datos en Firebase
    await this.firebaseSvc.updateUserInFirestore(user);
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