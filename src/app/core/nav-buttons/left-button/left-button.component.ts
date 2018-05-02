import { Component, ViewChild, ElementRef, Renderer2, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../data.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-left-button',
    templateUrl: './left-button.component.html',
    styleUrls: ['./left-button.component.css']
})
export class LeftButtonComponent implements OnInit {
    @ViewChild('leftButton') leftButton: ElementRef;
    getReadySubscription: Subscription;
    gameIsOn: boolean;
    leftButtonFeedbackColor: string;

    constructor(private dataService: DataService, public router: Router, private renderer: Renderer2) { }

    ngOnInit() {
        this.dataService.visualImmediateFeedback.subscribe(
            (feedback: {value: boolean, fromUserAction: boolean}) => {
                if (feedback.fromUserAction) {
                    if (this.dataService.getUserWantsImmediateFeedback()) {
                        this.leftButtonFeedbackColor = feedback.value ? 'green' : 'red';
                        setTimeout(() => this.leftButtonFeedbackColor = '', 950);
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
            this.dataService.whileGameClickdownEvent.next('left');
            return;
        }
        this.clickAction();
        this.dataService.isPageChanging = true;
        this.dataService.movePageRight.next();
        setTimeout(() => {
            switch (this.router.url) {
                case '/main':
                    this.router.navigate(['/stats']);
                    break;
                case '/game':
                    this.router.navigate(['/main']);
                    break;
                case '/stats':
                    this.router.navigate(['/game']);
                    break;
            }
            setTimeout(() => {
                this.dataService.isPageChanging = false;
            }, 700);
        }, 300);
    }

    private onGetReadyEvent(val: boolean) {
        if (val) {
            this.gameIsOn = true;
            this.renderer.removeClass(this.leftButton.nativeElement, 'left-button');
            this.renderer.removeClass(this.leftButton.nativeElement, 'corners');
            this.renderer.addClass(this.leftButton.nativeElement, 'left-button-while-game-shape');
            this.renderer.addClass(this.leftButton.nativeElement, 'left-button-while-game');
        } else {
            this.gameIsOn = false;
            this.renderer.removeClass(this.leftButton.nativeElement, 'left-button-while-game-shape');
            this.renderer.removeClass(this.leftButton.nativeElement, 'left-button-while-game');
            this.renderer.addClass(this.leftButton.nativeElement, 'corners');
            this.renderer.addClass(this.leftButton.nativeElement, 'left-button');
        }
    }
    private clickAction(): void {
        this.renderer.removeClass(this.leftButton.nativeElement, 'left-button-while-game');
        this.renderer.addClass(this.leftButton.nativeElement, 'left-button-while-game-clicked');
        setTimeout(() =>  {
            this.renderer.removeClass(this.leftButton.nativeElement, 'left-button-while-game-clicked');
            this.renderer.addClass(this.leftButton.nativeElement, 'left-button-while-game');
        }, 200);
    }
}
