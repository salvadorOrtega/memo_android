import { Component, OnInit, Renderer2, ViewChild, ElementRef, Input } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';

import * as Chartist from 'chartist';
import 'chartist';
import 'chartist-plugin-axistitle';
import 'chartist-plugin-legend';

@Component({
    selector: 'app-stats',
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
    @ViewChild('progressGraph') progressGraph: ElementRef;
    @ViewChild('statsContainer') statsContainer: ElementRef;
    @Input() nBackValue: number;
    noDataAvailable = true;
    loadedObj;
    graph;

    constructor(private renderer: Renderer2, private dataService: DataService, private router: Router) { }

    ngOnInit() {
        if (!this.dataService.hasGoneToMain) {
            this.router.navigate(['/main']);
        }
        this.loadedObj = this.dataService.getLoadedHistoryObject();
        this.nBackValue = this.dataService.getNBack();
        if (this.loadedObj[this.nBackValue].visual.length < 3) {
            this.presentPromptStatsPage();
        } else {
            this.generateChart(false, this.nBackValue);
        }
    }
    onUserNBackClick(increment: number) {
        if (this.nBackValue + increment > 10 || this.nBackValue + increment < 2) {
            return;
        }
        this.nBackValue += increment;
        this.generateChart(false, this.nBackValue);
    }
    private generateChart(demo: boolean = false, loadedObjNBack?: number) {
        let visualToLoad: number[] = [80, 50, 36, 41, 20, 30, 94, 54, 69, 90];
        let audioToLoad: number[] = [41, 50, 80, 36, 30, 20, 54, 80, 90, 80];
        if (!demo && this.loadedObj[loadedObjNBack].visual.length > 3) {
            visualToLoad = this.loadedObj[loadedObjNBack].visual;
            audioToLoad = this.loadedObj[loadedObjNBack].audio;
            this.noDataAvailable = false;
            this.renderer.removeClass(this.statsContainer.nativeElement, 'notEnoughData');
            this.renderer.addClass(this.statsContainer.nativeElement, 'statsContainerStart');
        } else {
            this.noDataAvailable = true;
            setTimeout(() => {
                if (this.noDataAvailable) {
                    this.renderer.removeClass(this.statsContainer.nativeElement, 'statsContainerStart');
                    this.renderer.addClass(this.statsContainer.nativeElement, 'notEnoughData');
                }
            }, 500);
        }
        this.graph = new Chartist.Line('.ct-chart', {
            labels: this.getXAxisLabels(visualToLoad.length),
            series: [
                {'name': 'Visual Scores', 'data': visualToLoad},
                {'name': 'Audio Scores', 'data': audioToLoad}]
        }, {
            fullWidth: true,
            axisY: {
                onlyInteger: true,
                type: Chartist.FixedScaleAxis,
                ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                low: 0,
                high: 100
            },
            plugins: [
                Chartist.plugins.ctAxisTitle({
                    axisY: {
                        axisTitle: 'Score (%)',
                        offset: {
                            x: '3%',
                            y: -5
                        },
                        axisClass: 'ct-axis-title'
                    },
                    axisX: {
                        axisTitle: 'Attempts',
                        axisClass: 'ct-axis-title',
                        textAnchor: 'middle',
                        offset: {
                            x: 0,
                            y: 30
                        }
                    }
                }),
                Chartist.plugins.legend()
            ]
        });
        this.graph.on('draw', function (data) {
            if (data.type === 'line') {
                data.element.animate({
                    d: {
                        begin: 0,
                        dur: 1000,
                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                        to: data.path.clone().stringify(),
                        easing: Chartist.Svg.Easing.easeOutQuint
                    },
                });
            }
            if (data.type === 'point') {
                data.element.animate({
                    opacity: {
                        begin: 700,
                        dur: '1000ms',
                        from: 0,
                        to: 1,
                        easing: Chartist.Svg.Easing.easeOutQuint
                    }
                });
            }
        });
    }
    private presentPromptStatsPage(demo = true) {
        this.noDataAvailable = true;
        this.generateChart(true);
    }
    private getXAxisLabels(arrLength: number) {
        const labels = [];
        for (let i = 0; i < arrLength; i++) {
            labels.push((i + 1).toString());
        }
        return labels;
    }
}
