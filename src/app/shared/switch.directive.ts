import { Subscription } from 'rxjs/Subscription';
import { GridPaneComponent } from './../game-grid/grid-pane/grid-pane.component';
import { DataService } from './../data.service';
import { Directive, HostBinding, Input, HostListener, OnInit } from '@angular/core';


@Directive({
    selector: '[appSwitch]'
})
export class SwitchDirective implements OnInit {
    @HostBinding('class.gridIn') colorIn = false;
    @HostBinding('class.transitionIn') transitionInClass: boolean;
    @HostBinding('class.grid') gridClass: boolean;
    @HostBinding('class.gridBeforeGameStart') gridBeforeGameStart: boolean;
    @HostBinding('class.controlButtonRollBack') controlButtonRollBack: boolean;
    @HostBinding('class.controlButtonWhileGame') controlButtonWhileGame: boolean;
    @HostBinding('class.controlButtonForward') controlButtonForward: boolean;
    @HostBinding('class.controlButtonStarted') controlButtonStarted: boolean;
    @HostBinding('class.controlButtonStart') controlButtonStart: boolean;
    @HostBinding('class.gridOnGameEnd') gridOnGameEnd: boolean;
    @HostBinding('style.cursor') cursor: string;
    @Input() isCenter: boolean;

    getReadySubscription: Subscription;

    animatedTransitionsDuration: number;
    colorStayDuration: number;
    transitioning = false;
    controlButtonToggle = true;
    runningGame: boolean;

    @HostListener('willActivate') onWillActivate() {
        if (this.isCenter) {
            return;
        }
        this.activate();
    }

    @HostListener('click') onControlButtonClick() {
        if (!this.isCenter || this.transitioning) {
            return;
        }
        if (this.controlButtonToggle && !this.runningGame) {
            this.startGame();
        } else if (!this.controlButtonToggle && this.runningGame) {
            this.endGame(true);
        }
    }

    constructor(private dataService: DataService) {
        this.colorStayDuration = this.dataService.getTimeInterval();
        this.animatedTransitionsDuration = this.dataService.getAnimatedTransitionsDuration();
    }

    ngOnInit() {
        this.getReadySubscription = this.dataService.getReady.subscribe(
            (val: boolean) => {
                if (this.isCenter) {
                    if (!val) {
                        this.endGame();
                    }
                } else {
                    this.getPaneReady(val);
                }
            }
        );
        this.isCenter ? this.centerButtonSettings() : this.gridBeforeGameStart = true;
    }

    private toggleControlButtonToggle() {
        this.controlButtonToggle = !this.controlButtonToggle;
    }
    private getPaneReady(val: boolean) {
        if (val) {
            this.transitionInClass = true;
            this.gridBeforeGameStart = false;
            this.gridClass = false;
            setTimeout(() => {
                this.gridClass = true;
            }, this.animatedTransitionsDuration);
        }
        if (!val) {
            setTimeout(() => {
                this.transitionInClass = false;
                this.gridOnGameEnd = true;
                setTimeout(() => {
                    this.gridClass = false;
                    this.gridOnGameEnd = false;
                    this.gridBeforeGameStart = true;
                }, this.animatedTransitionsDuration);
            }, this.animatedTransitionsDuration);
        }
    }
    private activate() {
        this.transitionInClass = false;
        this.colorIn = true;
        setTimeout(() => {
            this.colorIn = false;
        }, 1500);
    }
    private centerButtonSettings() {
        this.gridBeforeGameStart = false;
        this.cursor = 'pointer';
        this.controlStart();
    }
    private controlStart(start?: boolean) {
        if (this.transitioning) {
            return;
        }
        this.toggleTransition();
        this.controlButtonStart = true;
        setTimeout(() => {
            this.controlButtonStart = false;
            this.controlButtonStarted = true;
            this.toggleTransition();
        }, 0);
    }
    private startGame() {
        this.runningGame = true;
        this.controlButtonToggle = false;
        this.controlRollBack();
    }
    private endGame(fromButton?: boolean) {
        if (fromButton) {
            this.dataService.getReady.next(false);
            return;
        }
        this.controlButtonToggle = true;
        this.controlForward();
    }

    private controlForward() {
        this.toggleTransition();
        setTimeout(() => {
            this.controlButtonForward = true;
            this.controlButtonWhileGame = false;
            setTimeout(() => {
                this.controlButtonForward = false;
                this.controlButtonStarted = true;
                this.toggleTransition();
                this.runningGame = false;
            }, this.animatedTransitionsDuration);
        }, this.animatedTransitionsDuration * 2);
    }
    private controlRollBack() {
        setTimeout(() => {
            this.dataService.getReady.next(true);
        }, this.animatedTransitionsDuration);
        this.toggleTransition();
        this.controlButtonStarted = false;
        this.controlButtonStart = false;
        this.controlButtonRollBack = true;
        setTimeout(() => {
            this.controlButtonRollBack = false;
            this.controlButtonWhileGame = true;
            this.toggleTransition();
        }, this.animatedTransitionsDuration);
    }
    private toggleTransition() {
        this.transitioning = !this.transitioning;
    }
}
