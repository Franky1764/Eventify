import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { UtilsService } from './utils.service';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class ExportToExcelService {
  constructor(private utilsSvc: UtilsService) {}

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

      this.utilsSvc.presentConfirmAlert({
        header: 'Archivo guardado',
        message: 'El archivo se ha guardado exitosamente. ¿Deseas abrirlo?',
        confirmText: 'Abrir',
        cancelText: 'OK',
        confirmHandler: () => this.openFile(path),
      });
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
      this.utilsSvc.presentToast({
        message: 'Error al guardar el archivo',
        color: 'danger',
        duration: 3000,
      });
    }
  }

  private async openFile(path: string) {
    try {
      const uri = await Filesystem.getUri({
        directory: Directory.Documents,
        path,
      });

      if (Capacitor.isNativePlatform()) {
        window.open(uri.uri, '_system');
      } else {
        window.open(uri.uri, '_blank');
      }
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
      this.utilsSvc.presentToast({
        message: 'Error al abrir el archivo',
        color: 'danger',
        duration: 3000,
      });
    }
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
