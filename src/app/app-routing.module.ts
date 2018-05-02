import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { GameGridComponent } from './game-grid/game-grid.component';
import { StatsComponent } from './stats/stats.component';


const appRoutes: Routes = [
    { path: '', redirectTo: '/main', pathMatch: 'full'},
    { path: 'main', component: MainPageComponent},
    { path: 'game', component: GameGridComponent},
    { path: 'stats', component: StatsComponent},
    { path: '**', redirectTo: '/main', pathMatch: 'full'}
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes)
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
