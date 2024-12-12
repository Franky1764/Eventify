import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root',
})
export class ExportToExcelService {
  constructor() {}

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

    await Filesystem.writeFile({
      path: `${fileName}.xlsx`,
      data: base64Data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
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
