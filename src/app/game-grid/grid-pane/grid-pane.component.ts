import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DataService } from './../../data.service';


@Component({
    selector: 'app-grid-pane',
    templateUrl: './grid-pane.component.html',
    styleUrls: ['./grid-pane.component.css']
})
export class GridPaneComponent implements OnInit, OnDestroy {
    @Input() xPosition: number;
    @Input() yPosition: number;
    @Output() willActivate: EventEmitter<Array<number>> = new EventEmitter<Array<number>>();
    nextGridSub: Subscription;

    constructor(private dataService: DataService, private renderer: Renderer2) { }

    ngOnInit() {
        if (this.xPosition === 1 && this.yPosition === 1) {
            return;
        } else {
            this.memoPaneSettings();
        }
    }

    private memoPaneSettings() {
        this.nextGridSub = this.dataService.nextGrid.subscribe(
            (coordinate: Array<number>) => {
                if (coordinate[0] === this.xPosition && coordinate[1] === this.yPosition) {
                    this.willActivate.emit();
                }
            }
        );
    }

    ngOnDestroy() {
        if (this.nextGridSub) {
            this.nextGridSub.unsubscribe();
        }
    }
}
