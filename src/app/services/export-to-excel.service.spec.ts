import { TestBed } from '@angular/core/testing';

import { ExportToExcelService } from './export-to-excel.service';

describe('ExportToExcelService', () => {
  let service: ExportToExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportToExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
