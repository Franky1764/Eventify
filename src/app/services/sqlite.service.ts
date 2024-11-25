import { Injectable, signal, WritableSignal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
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
  private events: WritableSignal<Event[]> = signal<Event[]>([]);

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
      await this.loadEvents();
    } catch (error) {
      console.error('Error al abrir la base de datos:', error);
      throw error;
    }
  }

  private async createSchema() {
    const userSchema = `
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

    const eventSchema = `
      CREATE TABLE IF NOT EXISTS events (
        uid TEXT PRIMARY KEY,
        sede TEXT,
        tipoActividad TEXT,
        tituloEvento TEXT,
        fechaActividad TEXT,
        horarioInicio TEXT,
        horarioTermino TEXT,
        dependencia TEXT,
        modalidad TEXT,
        docenteRepresentante TEXT,
        invitados TEXT,
        directorParticipante TEXT,
        liderParticipante TEXT,
        subliderParticipante TEXT,
        embajadores TEXT,
        inscritos INTEGER,
        asistentesPresencial INTEGER,
        asistentesOnline INTEGER,
        enlaces TEXT
      );
    `;

    await this.db.execute(userSchema);
    await this.db.execute(eventSchema);
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

  async addUser(data: any) {
    const existingUser = await this.getUserById(data.uid);
    if (existingUser) {
      // Si el usuario existe, actualizarlo
      const query = `
        UPDATE users SET 
          username = ?, email = ?, nivel = ?, nombre = ?, apellido = ?, edad = ?, whatsapp = ?, carrera = ?, sede = ?, profilePhoto = ?
        WHERE uid = ?
      `;
      const values = [
        data.username, data.email, data.nivel, data.nombre, data.apellido, data.edad, data.whatsapp, data.carrera, data.sede, data.profilePhoto, data.uid
      ];
      const result = await this.db.run(query, values);
      await this.loadUsers();
      return result;
    } else {
      // Si el usuario no existe, insertarlo
      const query = `
        INSERT INTO users (
          uid, username, email, nivel, nombre, apellido, edad, whatsapp, carrera, sede, profilePhoto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        data.uid, data.username, data.email, data.nivel, data.nombre, data.apellido, data.edad, data.whatsapp, data.carrera, data.sede, data.profilePhoto
      ];
      const result = await this.db.run(query, values); // Ejecutar la inserción
      await this.loadUsers();
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
 
  // CRUD para Eventos (Métodos)
  async loadEvents() {
    try {
      const events = await this.db.query(`SELECT * FROM events`);
      this.events.set(events.values || []);
    } catch (error) {
      console.error('Error al cargar los eventos:', error);
    }
  }

  async getEventById(uid: string) {
    const query = `SELECT * FROM events WHERE uid = ?`;
    const res = await this.db.query(query, [uid]);
    return res.values.length > 0 ? res.values[0] : null;
  }

  async addEvent(event: Event) {
    const existingEvent = await this.getEventById(event.uid);
    if (existingEvent) {
      // Si el evento existe, actualizarlo
      const query = `
        UPDATE events SET 
          sede = ?, tipoActividad = ?, tituloEvento = ?, fechaActividad = ?, 
          horarioInicio = ?, horarioTermino = ?, dependencia = ?, modalidad = ?, 
          docenteRepresentante = ?, invitados = ?, directorParticipante = ?, 
          liderParticipante = ?, subliderParticipante = ?, embajadores = ?, 
          inscritos = ?, asistentesPresencial = ?, asistentesOnline = ?, enlaces = ?
        WHERE uid = ?
      `;
      const values = [
        event.sede, event.tipoActividad, event.tituloEvento, event.fechaActividad,
        event.horarioInicio, event.horarioTermino, event.dependencia, event.modalidad,
        event.docenteRepresentante, event.invitados, event.directorParticipante,
        event.liderParticipante, event.subliderParticipante, event.embajadores,
        event.inscritos, event.asistentesPresencial, event.asistentesOnline, event.enlaces,
        event.uid
      ];
      const result = await this.db.run(query, values);
      await this.loadEvents();
      return result;
    } else {
      // Si el evento no existe, insertarlo
      const query = `
        INSERT INTO events (
          uid, sede, tipoActividad, tituloEvento, fechaActividad, horarioInicio, horarioTermino, 
          dependencia, modalidad, docenteRepresentante, invitados, directorParticipante, 
          liderParticipante, subliderParticipante, embajadores, inscritos, 
          asistentesPresencial, asistentesOnline, enlaces
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        event.uid, event.sede, event.tipoActividad, event.tituloEvento, event.fechaActividad,
        event.horarioInicio, event.horarioTermino, event.dependencia, event.modalidad,
        event.docenteRepresentante, event.invitados, event.directorParticipante,
        event.liderParticipante, event.subliderParticipante, event.embajadores,
        event.inscritos, event.asistentesPresencial, event.asistentesOnline, event.enlaces
      ];
      const result = await this.db.run(query, values);
      await this.loadEvents();
      return result;
    }
  }

  async deleteEventById(uid: string) {
    const query = `DELETE FROM events WHERE uid = ?`;
    const result = await this.db.query(query, [uid]);
    await this.loadEvents();
    return result;
  }
}
