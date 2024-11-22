import { Component, OnInit, Input, Renderer2, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-view-photo',
  templateUrl: './view-photo.component.html',
  styleUrls: ['./view-photo.component.scss'],
})
export class ViewPhotoComponent implements OnInit {
  @Input() photoUrl: string;

  constructor(private modalController: ModalController, private renderer: Renderer2, private el: ElementRef) { }

  ngOnInit() {
    // Aplicar la animación de entrada
    this.renderer.addClass(this.el.nativeElement, 'fade-in');
  }

  closeModal() {
    // Aplicar la animación de salida
    this.renderer.removeClass(this.el.nativeElement, 'fade-in');
    this.renderer.addClass(this.el.nativeElement, 'fade-out');

    // Esperar a que la animación termine antes de cerrar el modal
    setTimeout(() => {
      this.modalController.dismiss();
    }, 300); // Duración de la animación
  }
}
