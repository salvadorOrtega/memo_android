import { Subscription } from 'rxjs/Subscription';
import { Injectable, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/Subject';

declare var NativeStorage: any;

@Injectable()
export class DataService {
    readonly timeInterval = 4000;
    readonly animatedTransitionsDuration = 1000;
    readonly chanceOfRepeat = 0.20;
    readonly x_size = 3;
    readonly y_size = 3;
    readonly soundSourceKeys: string[] = ['a', 'c', 'g', 'h', 'k', 'l', 'q', 'r', 's'];

    movePageRight: EventEmitter<any> = new EventEmitter<any>();
    movePageLeft: EventEmitter<any> = new EventEmitter<any>();

    nextGrid = new Subject<number[]>();
    getReady = new Subject<boolean>();
    visualGameResultsSubject = new Subject<boolean[]>();
    audioGameResultsSubject = new Subject<boolean[]>();
    visualImmediateFeedback = new Subject<{ value: boolean, fromUserAction: boolean }>();
    audioImmediateFeedback = new Subject<{ value: boolean, fromUserAction: boolean }>();
    whileGameClickdownEvent = new Subject<'left' | 'right'>();
    visualGameResultsSubscription: Subscription;
    audioGameResultsSubscription: Subscription;

    nBack = 2;
    userNumberOfAttempts = 20;
    numberOfAttempts = this.userNumberOfAttempts + this.nBack;
    attemptVisualCoordinatesArray: number[][];
    attemptAudioArray: string[];
    userWantsImmediateFeedback = true;
    lastVisualScore: number;
    lastAudioScore: number;
    maxNumberOfScores = 15;

    hasGoneToMain: boolean;
    isPageChanging: boolean;
    loadedHistoryObject;

    constructor() {
        this.generateNewVisualAttemptCoordinates();
        this.generateNewAuditoryAttempt();
        this.visualGameResultsSubscription = this.visualGameResultsSubject.subscribe(
            (resultsArr: boolean[]) => {
                const actual = this.getVisualBooleanArray();
                const result = this.calculateScores(actual, resultsArr);
                this.lastVisualScore = Math.ceil((result / this.userNumberOfAttempts) * 100);
            }
        );
        this.audioGameResultsSubscription = this.audioGameResultsSubject.subscribe(
            (resultsArr: boolean[]) => {
                const actual = this.getAudioBooleanArray();
                const result = this.calculateScores(actual, resultsArr);
                this.lastAudioScore = Math.ceil((result / this.userNumberOfAttempts) * 100);
            }
        );
    }


    public setLoadedHistoryObject(scores) {
        this.loadedHistoryObject = scores;
    }
    public getLoadedHistoryObject() {
        return this.loadedHistoryObject;
    }
    public saveResults() {
        this.pushScoresInDatabaseBoundArrays();
    }
    public setNBack(newNBack: number) {
        this.nBack = newNBack;
    }
    public getNBack(): number {
        return this.nBack;
    }
    public setUserWantsImmediateFeedback(val: boolean) {
        this.userWantsImmediateFeedback = val;
    }
    public getUserWantsImmediateFeedback(): boolean {
        return this.userWantsImmediateFeedback;
    }
    public setNumberOfAttempts(newNumberOfAttempts: number) {
        this.userNumberOfAttempts = newNumberOfAttempts;
        this.numberOfAttempts = this.getNumberOfAttempts() + this.getNBack();
    }
    public getNumberOfAttempts(): number {
        return this.userNumberOfAttempts;
    }
    public getAnimatedTransitionsDuration(): number {
        return this.animatedTransitionsDuration;
    }
    public getTimeInterval(): number {
        return this.timeInterval;
    }
    public getAttemptVisualCoordinatesArray(): number[][] {
        return this.attemptVisualCoordinatesArray.slice();
    }
    public getAttemptAudioArray(): string[] {
        return this.attemptAudioArray.slice();
    }
    public getVisualBooleanArray(): boolean[] {
        return this.calculateActualVisualRepetitions(this.attemptVisualCoordinatesArray);
    }
    public getAudioBooleanArray(): boolean[] {
        return this.calculateActualAuditoryRepetitions(this.attemptAudioArray);
    }
    public generateNewVisualAttemptCoordinates() {
        this.attemptVisualCoordinatesArray = [];
        for (let i = 0; i < this.numberOfAttempts; i++) {
            this.attemptVisualCoordinatesArray.push(this.generateNewCoordinate());
        }
        this.createRepeats('visual');
    }
    public generateNewAuditoryAttempt() {
        this.attemptAudioArray = [];
        for (let i = 0; i < this.numberOfAttempts; i++) {
            this.attemptAudioArray.push(this.generateNewAudioElement());
        }
        this.createRepeats('audio');
    }


    private pushScoresInDatabaseBoundArrays() {
        const arr = this.loadedHistoryObject[this.nBack];
        arr.visual.push(this.lastVisualScore);
        arr.audio.push(this.lastAudioScore);
        if (arr.visual.length > this.maxNumberOfScores) {
            arr.visual = this.trimOutputArray(arr.visual);
            arr.audio = this.trimOutputArray(arr.audio);
        }
        NativeStorage.setItem('userScores', this.loadedHistoryObject);
    }
    private trimOutputArray(inputArr: number[]) {
        return inputArr.slice(inputArr.length - this.maxNumberOfScores, inputArr.length);
    }
    private calculateScores(comparison: boolean[], inputArr: boolean[]): number {
        let matches = 0;
        for (let i = this.nBack; i < inputArr.length; i++) {
            if (comparison[i] === inputArr[i]) {
                matches++;
            }
        }
        return matches;
    }
    private calculateActualVisualRepetitions(generatedArray: number[][]): boolean[] {
        const result = [];
        for (let i = 0; i < this.attemptVisualCoordinatesArray.length; i++) {
            if (i < this.nBack) {
                result.push(false);
                continue;
            }
            const a = this.attemptVisualCoordinatesArray[i];
            const b = this.attemptVisualCoordinatesArray[i - this.nBack];

            result.push(a[0] === b[0] && a[1] === b[1]);
        }
        return result;
    }
    private calculateActualAuditoryRepetitions(generatedArray: string[]): boolean[] {
        const result = [];
        for (let i = 0; i < this.attemptAudioArray.length; i++) {
            if (i < this.nBack) {
                result.push(false);
                continue;
            }
            const a = this.attemptAudioArray[i];
            const b = this.attemptAudioArray[i - this.nBack];

            result.push(a === b);
        }
        return result;
    }
    private createRepeats(typeOfInput: string): void {
        let arr: string[] | number[][];

        switch (typeOfInput) {
            case 'audio':
                arr = this.attemptAudioArray;
                break;
            case 'visual':
                arr = this.attemptVisualCoordinatesArray;
                break;
        }
        for (let i = this.nBack; i < arr.length; i++) {
            if (this.shouldRepeat()) {
                arr[i] = arr[i - this.nBack];
            }
        }
    }
    private shouldRepeat(): boolean {
        return Math.random() < this.chanceOfRepeat;
    }
    private generateNewCoordinate(): number[] {
        let x: number = this.randomizer(0, this.x_size);
        let y: number = this.randomizer(0, this.y_size);

        while (x === 1 && y === 1) {
            x = this.randomizer(0, this.x_size);
            y = this.randomizer(0, this.y_size);
        }
        return [x, y];
    }
    private generateNewAudioElement(): string {
        return this.soundSourceKeys[this.randomizer(0, this.soundSourceKeys.length)];
    }
    private randomizer = (min, max) => {
        return Math.floor(Math.random() * (max - min) + min);
    }
}
