import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ExportToExcelService {
  constructor(private alertController: AlertController) {}

  async exportAsExcel(data: any[], fileName: string): Promise<void> {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eventos');

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const base64Data = await this.convertBlobToBase64(blob);

    const path = `${fileName}.xlsx`;

    try {
      await Filesystem.writeFile({
        path,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      this.presentAlert('Archivo guardado', 'El archivo se ha guardado exitosamente en la carpeta Documentos.');
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
      this.presentAlert('Error', 'Error al guardar el archivo');
    }
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }
}
