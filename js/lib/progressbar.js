var d3 = require("d3");
var utils = require("./utils.js");

/**
 * ProgressBar
 */
class ProgressBar {
    constructor(containerSelection, viewport, currentState, maximum) {
        this.id = "widget_" + utils.generateID();
        this.container = containerSelection.append('div')
            .attr('id', 'progressBar' + this.id);
        //
        var margin = { top: 0, right: 10, bottom: 0, left: 10 };

        const outerWidth = viewport.width;
        const outerHeight = viewport.height;
        this.width = outerWidth - margin.left - margin.right - 40;
        this.height = outerHeight - margin.top - margin.bottom;

        // Init SVG
        this.svg = this.container.append('svg')
            .attr('width', outerWidth)
            .attr('height', outerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        //
        this.barHeight = 20;
        this.svg.append('rect')
            .attr('id', 'bg-rect');
        this.svg.append('rect')
            .attr('id', 'progress-rect');
        this.svg.append('text')
            .attr('id', 'progress-label')
            .text('0%');

        //
        this.currentState = currentState;
        this.maximum = maximum;
        //
        this.render();
    }

    /*
     *
     */
    setState(n) {
        if (n != undefined) {
            this.currentState = n;
            this.render();
        }
    }

    render() {
        if (this.svg) {
            //
            const scaleX = d3.scaleLinear().domain([0, this.maximum]).range([0, this.width]);

            //
            this.svg.select('#bg-rect')
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('fill', 'lightgray')
                .attr('height', this.barHeight)
                .attr('width', this.width)
                .attr('x', 0)
                .attr('y', 0);

            //
            this.svg.select('#progress-rect')
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('fill', 'steelblue')
                .attr('height', this.barHeight)
                .attr('width', scaleX(this.currentState))
                .attr('x', 0);

            //
            this.svg.select('#progress-label')
                .attr('x', this.width + 3)
                .attr('alignment-baseline', 'middle')
                .attr('y', this.barHeight / 2);

            //
            this.svg.select('#progress-label')
                .text(this.currentState + '%');
        }
    }

}
module.exports = {
    ProgressBar: ProgressBar
};
