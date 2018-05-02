import { Component, ViewChild, OnInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DataService } from './data.service';
import { WindowRef } from './shared/window-ref';

declare var NativeStorage: any;

let scoresObj: any = {
    2:  {visual: [], audio: []},
    3:  {visual: [], audio: []},
    4:  {visual: [], audio: []},
    5:  {visual: [], audio: []},
    6:  {visual: [], audio: []},
    7:  {visual: [], audio: []},
    8:  {visual: [], audio: []},
    9:  {visual: [], audio: []},
    10: {visual: [], audio: []}
};

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    @ViewChild('transitionRouterShell') transitionRouterShell: ElementRef;
    @ViewChild('buttonsDiv') buttonsDiv: ElementRef;

    movePageLeftSubscription: Subscription;
    movePageRightSubscription: Subscription;

    constructor(private dataService: DataService, private renderer: Renderer2, private window: WindowRef) { }

    ngOnInit() {
        this.window.nativeWindow.onresize = () => {
            if (this.window.nativeWindow.innerHeight <= 520) {
                this.renderer.setStyle(this.buttonsDiv.nativeElement, 'top', '370px');
            } else {
                this.renderer.setStyle(this.buttonsDiv.nativeElement, 'top', '75%');
            }
        };
       this.window.nativeWindow.document.addEventListener('deviceready', () => {
            const getItems = new Promise((resolve, reject) => {
                NativeStorage.getItem('userScores', (scores) => resolve(scores), (error) => reject(error));
            })
            .then((scoresRetrieved) => scoresObj = scoresRetrieved)
            .catch((error) => {})
            .then((scoresRetrieved) => this.dataService.setLoadedHistoryObject(scoresObj));
        });
        this.movePageLeftSubscription = this.dataService.movePageLeft.subscribe(() => this.switchPageLeft());
        this.movePageRightSubscription = this.dataService.movePageRight.subscribe(() => this.switchPageRight());
    }

    private switchPageLeft() {
        this.renderer.addClass(this.transitionRouterShell.nativeElement, 'transitionLeft');
        setTimeout(
            () => this.renderer.removeClass(this.transitionRouterShell.nativeElement, 'transitionLeft')
        , 1000);
    }
    private switchPageRight() {
        this.renderer.addClass(this.transitionRouterShell.nativeElement, 'transitionRight');
        setTimeout(
            () => this.renderer.removeClass(this.transitionRouterShell.nativeElement, 'transitionRight')
        , 1000);
    }

    ngOnDestroy() {
        this.movePageLeftSubscription.unsubscribe();
        this.movePageRightSubscription.unsubscribe();
    }
}
