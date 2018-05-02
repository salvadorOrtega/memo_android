import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../data.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-right-button',
    templateUrl: './right-button.component.html',
    styleUrls: ['./right-button.component.css']
})
export class RightButtonComponent implements OnInit {
    @ViewChild('rightButton') rightButton: ElementRef;
    getReadySubscription: Subscription;
    gameIsOn: boolean;
    rightButtonFeedbackColor: string;

    constructor(private dataService: DataService, public router: Router, private renderer: Renderer2) { }

    ngOnInit() {
        this.dataService.audioImmediateFeedback.subscribe(
            (feedback: {value: boolean, fromUserAction: boolean}) => {
                if (feedback.fromUserAction) {
                    if (this.dataService.getUserWantsImmediateFeedback()) {
                        this.rightButtonFeedbackColor = feedback.value ? 'green' : 'red';
                        setTimeout(() => this.rightButtonFeedbackColor = '', 950);
                    } else {
                        this.clickAction();
                    }
                }
                return;
            }
        );
        this.getReadySubscription = this.dataService.getReady.subscribe(
            (val: boolean) => {
                setTimeout(() => {
                    this.onGetReadyEvent(val);
                }, val ? 0 : 2000);
            }
        );
    }

    onClick() {
        if (this.dataService.isPageChanging) {
            return;
        }
        if (this.gameIsOn) {
            this.dataService.whileGameClickdownEvent.next('right');
            return;
        }
        this.clickAction();
        this.dataService.isPageChanging = true;
        this.dataService.movePageLeft.next();
        setTimeout(() => {
            switch (this.router.url) {
                case '/main':
                    this.router.navigate(['/game']);
                    break;
                case '/game':
                    this.router.navigate(['/stats']);
                    break;
                case '/stats':
                    this.router.navigate(['/main']);
            }
            setTimeout(() => {
                this.dataService.isPageChanging = false;
            }, 700);
        }, 300);
    }
    private onGetReadyEvent(val: boolean) {
        if (val) {
            this.gameIsOn = true;
            this.renderer.removeClass(this.rightButton.nativeElement, 'right-button');
            this.renderer.removeClass(this.rightButton.nativeElement, 'corners');
            this.renderer.addClass(this.rightButton.nativeElement, 'right-button-while-game-shape');
            this.renderer.addClass(this.rightButton.nativeElement, 'right-button-while-game');
        } else {
            this.gameIsOn = false;
            this.renderer.removeClass(this.rightButton.nativeElement, 'right-button-while-game-shape');
            this.renderer.removeClass(this.rightButton.nativeElement, 'right-button-while-game');
            this.renderer.addClass(this.rightButton.nativeElement, 'corners');
            this.renderer.addClass(this.rightButton.nativeElement, 'right-button');
        }
    }
    private clickAction(): void {
        this.renderer.removeClass(this.rightButton.nativeElement, 'right-button-while-game');
        this.renderer.addClass(this.rightButton.nativeElement, 'right-button-while-game-clicked');
        setTimeout(() =>  {
            this.renderer.removeClass(this.rightButton.nativeElement, 'right-button-while-game-clicked');
            this.renderer.addClass(this.rightButton.nativeElement, 'right-button-while-game');
        }, 200);
    }
}
