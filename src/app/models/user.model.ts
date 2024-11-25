export interface User {
    uid: string;
    username: string;
    email: string;
    password: string;
    nivel: number,
    nombre: string,
    apellido: string,
    edad: number,
    whatsapp: string,
    carrera: string,
    sede: string,
    profilePhoto: string;
    profilePhotoData?: string;
}