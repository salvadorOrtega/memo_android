import { NgModule } from '@angular/core';
import { RightButtonComponent } from './nav-buttons/right-button/right-button.component';
import { LeftButtonComponent } from './nav-buttons/left-button/left-button.component';
import { CommonModule } from '@angular/common';


@NgModule({
    declarations: [
        RightButtonComponent,
        LeftButtonComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        RightButtonComponent,
        LeftButtonComponent
    ]
})
export class CoreModule { }
