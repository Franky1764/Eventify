import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes, CanActivate } from '@angular/router';
import { TabsComponent } from './tabs/tabs.component';
import { AuthGuard } from './services/auth.guard'; // Importamos AuthGuard

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./authentication/authentication.module').then(m => m.AuthenticationPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'tabs',
    component: TabsComponent,
    canActivate: [AuthGuard], // Protegemos la ruta 'tabs' con AuthGuard
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule),
        canActivate: [AuthGuard] // Protegemos la ruta 'dashboard' con AuthGuard
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule),
        canActivate: [AuthGuard] // Protegemos la ruta 'profile' con AuthGuard
      },
      {
        path: 'news',
        loadChildren: () => import('./news/news.module').then(m => m.NewsPageModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'gallery',
        loadChildren: () => import('./gallery/gallery.module').then( m => m.GalleryPageModule),
        canActivate: [AuthGuard]
      },
    ]
  },

  {
    path: '',
    redirectTo: 'tabs/gallery',
    pathMatch: 'full'
  },

  {
    path: 'category-details/:categoryName',
    loadChildren: () => import('./category-details/category-details.module').then(m => m.CategoryDetailsPageModule),
    canActivate: [AuthGuard] // Protegemos el acceso a las categorías
  },
  {
    path: 'not-found',
    loadChildren: () => import('./not-found/not-found.module').then(m => m.NotFoundPageModule)
  },

  {
    path: '**',
    redirectTo: 'not-found'
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
