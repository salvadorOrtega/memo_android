import { Component, ViewChild, OnInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DataService } from './data.service';
import { WindowRef } from './shared/window-ref';

/*
* NativeStorage object will only be available at runtime.
* This declaration prevents compilation errors.
*/
declare var NativeStorage: any;

/*
* Default scores data object to be used in case NativeStorage can't find
* one on device when attempting to retrieve it.
*/
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
    /*
    * Reference to the div wrapping the router-outlet element where
    * each new page will be displayed. This is done so as to more easily
    * style and animate changing pages.
    */
    @ViewChild('transitionRouterShell') transitionRouterShell: ElementRef;

    /*
    * Reference to the div element that contains both navigation buttons
    * to more easily control their positioning within the view.
    */
    @ViewChild('buttonsDiv') buttonsDiv: ElementRef;

    movePageLeftSubscription: Subscription;
    movePageRightSubscription: Subscription;

    constructor(private dataService: DataService, private renderer: Renderer2, private window: WindowRef) { }

    ngOnInit() {
        // Event listener that sets the height of the navigation buttons at a reasonable height from the top
        // depending on screen size and in case screen size changes after app start.
        this.window.nativeWindow.onresize = () => {
            if (this.window.nativeWindow.innerHeight <= 520) {
                this.renderer.setStyle(this.buttonsDiv.nativeElement, 'top', '370px');
            } else {
                this.renderer.setStyle(this.buttonsDiv.nativeElement, 'top', '75%');
            }
        };

        /*
        * Event triggered once when the device is ready. The handler wraps NativeStorage's
        * attempt to retrieve the score history object stored in persistent memory. If none was found, the Promise
        * rejects with an error dataService is sent a scoresObj with no scores, otherwise
        * the Promise resolves with the retrieved object and dataService is sent the result.
        */
        this.window.nativeWindow.document.addEventListener('deviceready', () => {
            const getItems = new Promise((resolve, reject) => {
                NativeStorage.getItem('userScores', (scores) => resolve(scores), (error) => reject(error));
            })
            .then((scoresRetrieved) => scoresObj = scoresRetrieved)
            .catch((error) => {})
            .then((scoresRetrieved) => this.dataService.setLoadedHistoryObject(scoresObj));
        });

        /*
        * AppComponent will catch clicks to the navigation buttons when a game is not being played
        * through these subscriptions. Meanwhile, the navigation button that was activated will order
        * the router-outlet to change its view to the requested page.
        */
        this.movePageLeftSubscription = this.dataService.movePageLeft.subscribe(() => this.switchPageLeft());
        this.movePageRightSubscription = this.dataService.movePageRight.subscribe(() => this.switchPageRight());
    }

    /*
    * Both of the following methods handle the page transition animation by moving the div wrapping
    * the router-outlet, transitionRouterShell, to the side; then allowing the nav button that was activated to change router-outlet's view
    * to the requested page; and finally slide transitionRouterShell in from the opposide direction from whence it left.
    */
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

    // This Angular lifecycle hook unsubscribes from custom events to avoid memory leaks.
    ngOnDestroy() {
        this.movePageLeftSubscription.unsubscribe();
        this.movePageRightSubscription.unsubscribe();
    }
}
