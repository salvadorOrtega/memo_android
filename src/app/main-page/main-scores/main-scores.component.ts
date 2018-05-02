import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DataService } from '../../data.service';

@Component({
    selector: 'app-main-scores',
    templateUrl: './main-scores.component.html',
    styleUrls: ['./main-scores.component.css']
})
export class MainScoresComponent implements OnInit {
    confirmAsk = false;
    scores = [];
    tableHeaders = ['Visual Score', 'Audio Score'];
    nBackData;

    constructor(private dataService: DataService) { }

    ngOnInit() {
        this.nBackData = this.dataService.getNBack();
        const loaded = this.dataService.getLoadedHistoryObject();
        const arr = loaded[this.nBackData];
        const visuals = arr['visual'].slice().reverse();
        const audios = arr['audio'].slice().reverse();
        for (let i = 0; i < visuals.length; i++) {
            this.scores.push([visuals[i], audios[i]]);
        }
    }
    onClearProgress() {
        const emptyNObject = this.dataService.getLoadedHistoryObject();
        emptyNObject[this.nBackData].visual = [];
        emptyNObject[this.nBackData].audio = [];
        this.dataService.setLoadedHistoryObject(emptyNObject);
        this.scores = [];
        this.isUserSure(false);
    }
    isUserSure(val: boolean) {
        this.confirmAsk = val;
    }
}
