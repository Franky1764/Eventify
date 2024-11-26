import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss'],
})
export class GalleryPage implements OnInit {
  photos = [
    { url: 'assets/img/photo1.jpg', title: 'Foto 1' },
    { url: 'assets/img/photo2.jpg', title: 'Foto 2' },
    { url: 'assets/img/photo3.jpg', title: 'Foto 3' },
    { url: 'assets/img/photo4.jpg', title: 'Foto 4' },
  ];

  constructor() {}

  ngOnInit() {}
}
