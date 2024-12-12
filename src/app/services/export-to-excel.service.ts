import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AlertController, Platform } from '@ionic/angular';
import { Event } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class ExportToExcelService {
  constructor(private alertController: AlertController, private platform: Platform) {}

  async exportAsExcel(data: Event[], fileName: string): Promise<void> {
    // Crear los encabezados basados en el modelo de evento, excluyendo 'uid'
    const headers = [
      'sede', 'tipoActividad', 'tituloEvento', 'fechaActividad', 'horarioInicio', 'horarioTermino',
      'dependencia', 'modalidad', 'docenteRepresentante', 'invitados', 'directorParticipante',
      'liderParticipante', 'subliderParticipante', 'embajadores', 'inscritos', 'asistentesPresencial',
      'asistentesOnline', 'enlaces'
    ];

    // Convertir los datos a un formato adecuado para XLSX, excluyendo 'uid'
    const worksheetData = [headers, ...data.map(event => [
      event.sede || '', event.tipoActividad || '', event.tituloEvento || '', event.fechaActividad || '', event.horarioInicio || '',
      event.horarioTermino || '', event.dependencia || '', event.modalidad || '', event.docenteRepresentante || '', event.invitados || '',
      event.directorParticipante || '', event.liderParticipante || '', event.subliderParticipante || '', event.embajadores || '',
      event.inscritos || 0, event.asistentesPresencial || 0, event.asistentesOnline || 0, event.enlaces || ''
    ])];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Eventos': worksheet },
      SheetNames: ['Eventos'],
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filePath = `${fileName}.xlsx`;

    if (this.platform.is('hybrid')) {
      // Para dispositivos móviles
      try {
        const base64Data = await this.blobToBase64(blob);

        await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });

        this.presentAlert('Archivo guardado', 'El archivo se ha guardado exitosamente en la carpeta Documentos.');
      } catch (error) {
        console.error('Error al guardar el archivo:', error);
        this.presentAlert('Error', 'Error al guardar el archivo');
      }
    } else {
      // Para navegadores web
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filePath;
      anchor.click();
      window.URL.revokeObjectURL(url);

      this.presentAlert('Archivo descargado', 'El archivo se ha descargado correctamente.');
    }
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['Aceptar'],
    });

    await alert.present();
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort();
        reject(new Error('Error al convertir blob a base64.'));
      };
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }
}
