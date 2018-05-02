import { Component, OnInit, Input, OnDestroy, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit, OnDestroy {

    @Input() userNBackValue: number;
    @Input() turnsPerGame: number;
    @ViewChild('formGroupRef') formGroupRef: ElementRef;
    userWantsImmediateFeedback: boolean;
    userIsSignedIn = true;
    buttonActivated: 'settings' | 'account' | 'info' = 'settings';
    willChangeTo: 'settings' | 'account' | 'info' = 'settings';
    pageChanging = false;

    constructor(private dataService: DataService, private renderer: Renderer2) { }

    ngOnInit() {
        this.getInitialData();
        this.dataService.hasGoneToMain = true;
    }

    public changeMenuDisplay(page: 'settings' | 'account' | 'info') {
        if (page === this.buttonActivated || this.pageChanging) {
            return;
        }
        this.pageChanging = true;
        this.willChangeTo = page;
        setTimeout(() => {
            this.buttonActivated = page;
            this.renderer.removeClass(this.formGroupRef.nativeElement, 'minimizing');
            this.renderer.addClass(this.formGroupRef.nativeElement, 'maximizing');
            setTimeout(() => this.pageChanging = false, 800);
        }, 800);
        this.renderer.removeClass(this.formGroupRef.nativeElement, 'maximizing');
        this.renderer.addClass(this.formGroupRef.nativeElement, 'minimizing');
    }
    private onUserNBackClick(increment: number) {
        if (this.userNBackValue + increment > 10 || this.userNBackValue + increment < 2) {
            return;
        }
        this.userNBackValue += increment;
        this.dataService.setNBack(this.userNBackValue);
    }
    private onTurnsPerGameClick(increment: number) {
        if (this.turnsPerGame + increment > 40 || this.turnsPerGame + increment < 20) {
            return;
        }
        this.turnsPerGame += increment;
    }
    private setUserWantsImmediateFeedback() {
        this.userWantsImmediateFeedback = !this.userWantsImmediateFeedback;
    }
    private getInitialData(): void {
        this.userNBackValue = this.dataService.getNBack();
        this.turnsPerGame = this.dataService.getNumberOfAttempts();
        this.userWantsImmediateFeedback = this.dataService.getUserWantsImmediateFeedback();
    }
    private sendDataToDataService(): void {
        this.dataService.setNBack(this.userNBackValue);
        this.dataService.setNumberOfAttempts(this.turnsPerGame);
        this.dataService.setUserWantsImmediateFeedback(this.userWantsImmediateFeedback);
    }

    ngOnDestroy() {
        this.sendDataToDataService();
    }
}
