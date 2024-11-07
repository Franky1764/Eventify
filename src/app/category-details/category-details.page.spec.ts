import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryDetailsPage } from './category-details.page';

describe('CategoryDetailsPage', () => {
  let component: CategoryDetailsPage;
  let fixture: ComponentFixture<CategoryDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
