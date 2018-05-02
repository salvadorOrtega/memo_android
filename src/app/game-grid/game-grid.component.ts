import { Subscription } from 'rxjs/Subscription';
import { DataService } from './../data.service';
import { Component, OnInit, OnDestroy, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';


@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.css']
})
export class GameGridComponent implements OnInit, OnDestroy {
    @ViewChild('audioElement') audioElement: ElementRef;
    readonly gridArrayCoordinates = [[[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]]];
    attemptVisualCoordinatesArray: number[][];
    attemptAudioArray: string[];
    openForVisual = false;
    openForAuditory = false;
    visualUserInputArray: boolean[] = [];
    visualBooleanArray: boolean[];
    auditoryUserInputArray: boolean[] = [];
    auditoryBooleanArray: boolean[];
    timeInterval: number;
    nBack: number;
    gameStarted = false;
    visualAttemptIndex = -1;
    audioAttemptIndex = -1;
    userWantsImmediateFeedback = true;
    exitedBeforeNgOnInitComplete: boolean;
    whileGameClickdownEventSubscription: Subscription;
    controlButtonAction: Subscription;

    constructor(private dataService: DataService, private renderer: Renderer2, private router: Router) { }

    ngOnInit() {
        if (!this.dataService.hasGoneToMain) {
            this.router.navigate(['/main']);
            this.exitedBeforeNgOnInitComplete = true;
            return;
        }
        this.whileGameClickdownEventSubscription = this.dataService.whileGameClickdownEvent.subscribe(
            (leftOrRightButtonClicked: 'left' | 'right') => {
                this.onClickdownEvent(leftOrRightButtonClicked);
            }
        );
        this.controlButtonAction = this.dataService.getReady.subscribe(
            (val: boolean) => {
                if (val) {
                    this.startGame();
                } else {
                    this.onGameEnd();
                }
            }
        );
        this.timeInterval = this.dataService.getTimeInterval();
        this.nBack = this.dataService.getNBack();
        this.userWantsImmediateFeedback = this.dataService.getUserWantsImmediateFeedback();
        this.loadDataForNextGame();
        this.exitedBeforeNgOnInitComplete = false;
    }

    startGame() {
        if (this.gameStarted) {
            return;
        }
        this.gameStarted = true;
        function* generator(arr) {
            const len = arr.length;
            let i = 0;
            while (i < len) {
                yield arr[i++];
            }
        }
        const visualIterator = generator(this.attemptVisualCoordinatesArray);
        const audioIterator = generator(this.attemptAudioArray);
        const intervalCallback = () => {
            setTimeout(() => {
                this.fillIfNoInputs();
            }, this.timeInterval - 200);
            const visualRes = visualIterator.next();
            const audioRes = audioIterator.next();
            if (visualRes.done || !this.gameStarted) {
                clearInterval(intervalID);
                if (visualRes.done) {
                    setTimeout(() => {
                        this.onGameEnd(true);
                        this.dataService.getReady.next(false);
                    }, this.userWantsImmediateFeedback ? 1000 : 0);
                }
            } else {
                this.triggerVisualStimulus(visualRes.value);
                this.triggerAudioStimulus(audioRes.value);
                this.openStimuliGates();
            }
        };
        const intervalID = setInterval(intervalCallback, this.timeInterval);
    }
    onClickdownEvent(leftOrRightButtonClicked: 'left' | 'right') {
        if (!this.gameStarted) {
            return;
        }
        switch (leftOrRightButtonClicked) {
            case 'right':
                if (this.openForAuditory) {
                    this.pushTriggerValue('audio', true, true);
                }
                break;
            case 'left':
                if (this.openForVisual) {
                    this.pushTriggerValue('visual', true, true);
                }
                break;
        }
    }
    private pushTriggerValue(stimulusType: string, pushValue: boolean, fromUserAction: boolean) {
        switch (stimulusType) {
            case 'visual':
                this.visualAttemptIndex++;
                this.openForVisual = false;
                this.visualUserInputArray.push(pushValue);
                if (this.visualAttemptIndex >= this.nBack) {
                    this.dataService.visualImmediateFeedback.next(
                        {
                            value: this.visualBooleanArray[this.visualAttemptIndex] === pushValue,
                            fromUserAction: fromUserAction
                        }
                    );
                }
                break;
            case 'audio':
                this.audioAttemptIndex++;
                this.openForAuditory = false;
                this.auditoryUserInputArray.push(pushValue);
                if (this.audioAttemptIndex >= this.nBack) {
                    this.dataService.audioImmediateFeedback.next(
                        {
                            value: this.auditoryBooleanArray[this.audioAttemptIndex] === pushValue,
                            fromUserAction: fromUserAction
                        }
                    );
                }
                break;
        }
    }
    private fillIfNoInputs(): void {
        if (this.openForVisual) {
            this.pushTriggerValue('visual', false, false);
        }
        if (this.openForAuditory) {
            this.pushTriggerValue('audio', false, false);
        }
    }
    private loadDataForNextGame() {
        this.visualBooleanArray = this.dataService.getVisualBooleanArray();
        this.auditoryBooleanArray = this.dataService.getAudioBooleanArray();
        this.attemptVisualCoordinatesArray = this.dataService.getAttemptVisualCoordinatesArray();
        this.attemptAudioArray = this.dataService.getAttemptAudioArray();
        this.timeInterval = this.dataService.getTimeInterval();
    }
    private triggerAudioStimulus(sourceURI: string) {
        const audioFile = 'file:///android_asset/www/assets/sounds/' + sourceURI + '.mp3';
        this.renderer.setProperty(this.audioElement.nativeElement, 'autoplay', true);
        this.renderer.setProperty(this.audioElement.nativeElement, 'src', audioFile);
    }
    private triggerVisualStimulus(coordinate: number[]) {
        this.dataService.nextGrid.next(coordinate);
    }
    private onGameEnd(fromIterFinished?: boolean) {
        if (fromIterFinished) {
            this.sendStimuliResults();
        }
        this.stopGame();
        this.resetGame();
    }
    private sendStimuliResults() {
        this.dataService.visualGameResultsSubject.next(this.visualUserInputArray);
        this.dataService.audioGameResultsSubject.next(this.auditoryUserInputArray);
        this.dataService.saveResults();
    }
    private stopGame() {
        this.gameStarted = false;
        this.closeStimuliGates();
    }
    private changeStimuliGates(val: boolean) {
        this.openForAuditory = val;
        this.openForVisual = val;
    }
    private openStimuliGates() {
        this.changeStimuliGates(true);
    }
    private closeStimuliGates() {
        this.changeStimuliGates(false);
    }
    private resetGame() {
        this.visualAttemptIndex = -1;
        this.audioAttemptIndex = -1;
        this.gameStarted = false;
        this.visualUserInputArray = [];
        this.auditoryUserInputArray = [];
        this.dataService.generateNewVisualAttemptCoordinates();
        this.dataService.generateNewAuditoryAttempt();
        this.loadDataForNextGame();
    }

    ngOnDestroy() {
        if (!this.exitedBeforeNgOnInitComplete) {
            this.controlButtonAction.unsubscribe();
        }
    }
}
