import { Subscription } from 'rxjs/Subscription';
import { Injectable, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/Subject';

/*
* NativeStorage object will only be available at runtime.
* This declaration prevents compilation errors.
*/
declare var NativeStorage: any;

/**
 * Main application-wide state management service.
 *
 * DataService hosts a few structural readonly variables such as
 * the size of the game grid and time intervals between different events.
 *
 * Class properties and methods that need to be accessed from the template
 * need public access due to this issue:
 * https://github.com/angular/angular/issues/11978
**/
@Injectable()
export class DataService {
    // Time duration of transitions between game attempts.
    readonly timeInterval = 4000;

    // Time duration of grid pane transitioning from inactive to active (and active to inactive).
    readonly animatedTransitionsDuration = 1000;

    // Chance that the previous M - (N-back) attempt is the same as M.
    readonly chanceOfRepeat = 0.20;

    // Game grid measurements. Prevents code repetition in GameGridComponent template.
    readonly x_size = 3;
    readonly y_size = 3;

    // Array of letter audio assets. A randomized subset is created for every new attempt.
    readonly soundSourceKeys: string[] = ['a', 'c', 'g', 'h', 'k', 'l', 'q', 'r', 's'];

    // Maximum number of scores that can be stored by NativeStorage per n-back level
    readonly maxNumberOfScores = 15;

    /*
    * Events triggered by clicking on the navigation buttons from any page.
    * AppComponent will be listening to trigger appropriate page transition.
    */
    movePageRight: EventEmitter<any> = new EventEmitter<any>();
    movePageLeft: EventEmitter<any> = new EventEmitter<any>();

    /*
    * Each grid pane will independently subscribe to nextGrid Subject to listen
    * for its own coordinates being emitted to then trigger its own activation animation.
    */
    nextGrid = new Subject<number[]>();

    /*
    * Event indicating user clicked center pane.
    * It should emit true if game is being started, false if it's ending.
    */
    getReady = new Subject<boolean>();

    /*
    * Events triggered at the end of a completed game by GameGridComponent,
    * sending user responses arrays to this service for scoring.
    */
    visualGameResultsSubject = new Subject<boolean[]>();
    audioGameResultsSubject = new Subject<boolean[]>();

    /*
    * If user chose to receive immediate feedback, these events
    * tell navigation buttons to animate whether user was right or wrong.
    */
    visualImmediateFeedback = new Subject<{ value: boolean, fromUserAction: boolean }>();
    audioImmediateFeedback = new Subject<{ value: boolean, fromUserAction: boolean }>();

    /*
    * Event triggered by navigation buttons during game telling
    * GameGridComponent which button has been pressed.
    */
    whileGameClickdownEvent = new Subject<'left' | 'right'>();

    /*
    * Variables holding DataService's subscription objects to
    * its own visualGameResultsSubject and audioGameResultsSubject.
    */
    visualGameResultsSubscription: Subscription;
    audioGameResultsSubscription: Subscription;

    // Variables a user can change in Settings menu of MainPageComponent.
    nBack = 2;
    userNumberOfAttempts = 20;
    numberOfAttempts = this.userNumberOfAttempts + this.nBack;
    userWantsImmediateFeedback = true;

    /*
    * Arrays holding the next game's output that will be show to user.
    * Both arrays are assigned fresh new values after a game has ended and
    * after a game has been suspended.
    */
    attemptVisualCoordinatesArray: number[][];
    attemptAudioArray: string[];

    /*
    * Properties holding the score of the last completed game.
    * Scores of suspended games are not calculated
    */
    lastVisualScore: number;
    lastAudioScore: number;

    /*
    * Only MainPage sets this property to true on first visit. It indicates to other components that if, for
    * some reason, they are being initiated without MainPage being initiated first, they should
    * redirect to MainPage. Otherwise the variables they depend on will not have been set
    * and the app will crash.
    */
    hasGoneToMain: boolean;

    /*
    * Property set to true when a transition to a different page has been initiated
    * and the amount of time to complete it hasn't passed.
    *
    * To ensure smooth transitions, only when this property is false will nav buttons
    * allow page transitions, then immidiately set it to true while navigation to
    * a new page is occuring, and finally set it to false
    * after the amount of time it takes to transition has passed.
    */
    isPageChanging: boolean;

    /*
    * Object initially set by AppComponent after NativeStorage retrieves it from native
    * memory. If no stored object was found, it will set this variable to an appropriate object
    * with no scores.
    */
    loadedHistoryObject;

    constructor() {
        /*
        * To avoid delays, we create two fresh stimuli arrays as soon as
        * the app is started to be ready to use them for the first game.
        */
        this.generateNewVisualAttemptCoordinates();
        this.generateNewAuditoryAttempt();

        /*
        * This subscription receives the array of user responses to visual stimuli from GameGridComponent,
        * resultsArr, where a value of true at index i indicates that the user believed that the ith stimulus
        * was the same as the i-nBack stimulus. resultsArr[i] is false otherwise.
        */
        this.visualGameResultsSubscription = this.visualGameResultsSubject.subscribe(
            (resultsArr: boolean[]) => {
                const actual = this.getVisualBooleanArray();
                const result = this.calculateScores(actual, resultsArr);
                this.lastVisualScore = Math.ceil((result / this.userNumberOfAttempts) * 100);
            }
        );

        /*
        * This subscription receives the array of user responses to audio stimuli from GameGridComponent,
        * resultsArr, where a value of true at index i indicates that the user believed that the ith stimulus
        * was the same as the i-nBack stimulus. resultsArr[i] is false otherwise.
        */
        this.audioGameResultsSubscription = this.audioGameResultsSubject.subscribe(
            (resultsArr: boolean[]) => {
                const actual = this.getAudioBooleanArray();
                const result = this.calculateScores(actual, resultsArr);
                this.lastAudioScore = Math.ceil((result / this.userNumberOfAttempts) * 100);
            }
        );
    }

    /*
    * The history object stored by NativeStorage is not queried after initial
    * app start; all new scores are set in the initial copy created, then
    * NativeStorage updates the object in native memory to reflect new changes.
    */
    public setLoadedHistoryObject(scores) {
        this.loadedHistoryObject = scores;
    }

    public getLoadedHistoryObject() {
        return this.loadedHistoryObject;
    }

    public saveResults() {
        this.pushScoresInDatabaseBoundArrays();
    }

    // Method used to apply user choice from Settings menu in MainPageComponent
    public setNBack(newNBack: number) {
        this.nBack = newNBack;
    }

    public getNBack(): number {
        return this.nBack;
    }

    // Method used to apply user choice from Settings menu in MainPageComponent
    public setUserWantsImmediateFeedback(val: boolean) {
        this.userWantsImmediateFeedback = val;
    }

    public getUserWantsImmediateFeedback(): boolean {
        return this.userWantsImmediateFeedback;
    }

    // Method used to apply user choice from Settings menu in MainPageComponent
    public setNumberOfAttempts(newNumberOfAttempts: number) {
        this.userNumberOfAttempts = newNumberOfAttempts;
        /*
        * The number of attempts presented to user per game, in reality,
        * will always be nBack more than chosen number to allow for more uniformity
        * in number of repetitions across nBack levels.
        */
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

    /*
    * This method returns the calculated array of boolean values where a value
    * of true at array index n means that the nth visual stimulus is the same as the n - nBack visual stimulus.
    * A value of false means array[nth] and array[n-nBack] are different.
    */
    public getVisualBooleanArray(): boolean[] {
        return this.calculateActualVisualRepetitions();
    }

    /*
    * This method returns the calculated array of boolean values where a value
    * of true at array index n means that the nth auditory stimulus is the same as the n - nBack auditory stimulus.
    * A value of false means array[nth] and array[n-nBack] are different.
    */
    public getAudioBooleanArray(): boolean[] {
        return this.calculateActualAuditoryRepetitions();
    }

    /*
    * Creates a fresh array of randomized combinations of grid coordinates to assign to this.attemptVisualCoordinatesArray.
    * Then it signals to method this.createRepeats that it should modify the newly created array to ensure it
    * contains, on average, [this.attemptVisualCoordinatesArray.length * this.chanceOfRepeat] repeats.
    */
    public generateNewVisualAttemptCoordinates() {
        this.attemptVisualCoordinatesArray = [];
        for (let i = 0; i < this.numberOfAttempts; i++) {
            this.attemptVisualCoordinatesArray.push(this.generateNewCoordinate());
        }
        this.createRepeats('visual');
    }

    /*
    * Creates a fresh array of randomized combinations of audio keys to assign to this.attemptAudioArray.
    * Then it signals to method this.createRepeats that it should modify the newly created array to ensure it
    * contains, on average, [this.attemptAudioArray.length * this.chanceOfRepeat] repeats.
    */
    public generateNewAuditoryAttempt() {
        this.attemptAudioArray = [];
        for (let i = 0; i < this.numberOfAttempts; i++) {
            this.attemptAudioArray.push(this.generateNewAudioElement());
        }
        this.createRepeats('audio');
    }

    /*
    * This method updates the history object in RAM with latest score,
    * then it has NativeStorage plugin rewrite history object in persistent memory
    * to equal that in RAM.
    *
    * Limiting the size of scores kept in memory improves read and write speed, and visibility
    * of all scores in graph and MainPage scores table.
    */
    private pushScoresInDatabaseBoundArrays() {
        const arr = this.loadedHistoryObject[this.nBack];
        arr.visual.push(this.lastVisualScore);
        arr.audio.push(this.lastAudioScore);

        // If the size of the scores array is greater than maxNumberOfScores,
        // only keep last maxNumberOfScores scores.
        if (arr.visual.length > this.maxNumberOfScores) {
            arr.visual = this.trimOutputArray(arr.visual);
            arr.audio = this.trimOutputArray(arr.audio);
        }
        NativeStorage.setItem('userScores', this.loadedHistoryObject);
    }

    // Method returns a new array of the latest this.maxNumberOfScores members of inputArr.
    private trimOutputArray(inputArr: number[]) {
        return inputArr.slice(inputArr.length - this.maxNumberOfScores, inputArr.length);
    }

    // This method returns the number of times comparison[i] == inputArr[i].
    private calculateScores(comparison: boolean[], inputArr: boolean[]): number {
        let matches = 0;
        for (let i = this.nBack; i < inputArr.length; i++) {
            if (comparison[i] === inputArr[i]) {
                matches++;
            }
        }
        return matches;
    }

    /*
    * This method returns a fresh array of boolean values where a value of true at index i
    * means that the grid pane coordinate at position i is the same as the one at position
    * i - this.nBack in this.attemptVisualCoordinatesArray; it should be false otherwise.
    */
    private calculateActualVisualRepetitions(): boolean[] {
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

    /*
    * This method returns a fresh array of boolean values where a value of true at index i
    * means that the audio file key at position i is the same as the one at position
    * i - this.nBack in this.attemptAudioArray; it is false otherwise.
    */
    private calculateActualAuditoryRepetitions(): boolean[] {
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

    /*
    * This method traverses the array indicated by the typeOfInput argument
    * and randomly sets element [i] to equal element [i - this.nBack] an average of
    * this.chanceOfRepeat times.
    */
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

    /*
    * This method returns true at an average rate of [this.chanceOfRepeat * 100]%.
    * It uses the fact that Math.random returns a random number within the range [0,1) uniformly.
    * Therefore, this.chanceOfRepeat * 100 percent of the time the random number generated will be
    * lower than this.chanceOfRepeat.
    */
    private shouldRepeat(): boolean {
        return Math.random() < this.chanceOfRepeat;
    }

    /*
    * Method returns a single ordered pair [x,y] that corresponds to the coordinate
    * of a pane within the game grid, with the exception of the control button [1,1].
    * Intended to generate visual stimuli only.
    */
    private generateNewCoordinate(): number[] {
        let x: number = this.randomizer(0, this.x_size);
        let y: number = this.randomizer(0, this.y_size);

        while (x === 1 && y === 1) {
            x = this.randomizer(0, this.x_size);
            y = this.randomizer(0, this.y_size);
        }
        return [x, y];
    }

    // Returns a single element of the possible audio files keys chosen at random.
    private generateNewAudioElement(): string {
        return this.soundSourceKeys[this.randomizer(0, this.soundSourceKeys.length)];
    }

    // Method returns an integer within the range [min, max).
    private randomizer = (min, max) => {
        return Math.floor(Math.random() * (max - min) + min);
    }
}
