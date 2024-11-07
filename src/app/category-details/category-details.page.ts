import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-category-details',
  templateUrl: './category-details.page.html',
  styleUrls: ['./category-details.page.scss'],
})
export class CategoryDetailsPage implements OnInit {
  categoryName: string | null = null;
  events: any[] = []; 

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    
    this.categoryName = this.route.snapshot.paramMap.get('categoryName') || '';
    
    this.loadEvents();
  }

  loadEvents() {
    
    const allEvents = [
      { name: 'Taller', category: 'Talleres' },
      { name: 'Desafío', category: 'Desafíos' },
      { name: 'Mentoría', category: 'Mentorías' },
      { name: 'Charla', category: 'Charlas' },
      { name: 'Stand', category: 'Stands' }
    ];

    // Filtro de eventos por la categoría seleccionada
    this.events = allEvents.filter(event => event.category === this.categoryName);
  }
}
