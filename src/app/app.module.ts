import { DataService } from './data.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { GameGridComponent } from './game-grid/game-grid.component';
import { SwitchDirective } from './shared/switch.directive';
import { GridPaneComponent } from './game-grid/grid-pane/grid-pane.component';
import { CoreModule } from './core/core.module';
import { StatsComponent } from './stats/stats.component';
import { MainPageComponent } from './main-page/main-page.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { MainScoresComponent } from './main-page/main-scores/main-scores.component';
import { CommonModule } from '@angular/common';
import { WindowRef } from './shared/window-ref';

@NgModule({
  declarations: [
    AppComponent,
    GameGridComponent,
    SwitchDirective,
    GridPaneComponent,
    StatsComponent,
    MainPageComponent,
    MainScoresComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    CoreModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [DataService, WindowRef],
  bootstrap: [AppComponent]
})
export class AppModule { }
