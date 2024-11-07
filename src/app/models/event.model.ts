export interface Event {
    uid:string;
    sede: string;
    tipoActividad: string;
    tituloEvento: string;
    fechaActividad: string;
    horarioInicio: string;
    horarioTermino: string;
    dependencia: string;
    modalidad: string;
    docenteRepresentante: string;
    invitados: string;
    directorParticipante: string;
    liderParticipante: string;
    subliderParticipante: string;
    embajadores: string;
    inscritos: number;
    asistentesPresencial: number;
    asistentesOnline: number;
    enlaces: string;
}