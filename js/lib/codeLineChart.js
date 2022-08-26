var d3 = require("d3");
var utils = require("./utils.js");

function _brushed(event) {
    var group = this.g;
    var x = this.scale;
    var brush = this.brush;
    const selection = event.selection;
    if (selection === null) {
        const [mx] = d3.pointer(event, group.node());
        group.call(brush.move, [mx, mx]);
        return;
    }
    group.call(_brushHandle.bind(this), selection);
}

function _brushHandle(g, s) {
    var radius = this.r;
    var diam = 2 * radius;
    var slack = this.slack;
    var arc = arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle((d, i) => i ? Math.PI : -Math.PI);
    var triangle = function (d, i) {
        if (i == 0) {
            return `M -1 ${diam / 3} L -1 ${2 * diam / 3} L ${-radius / 5} ${radius} L -1 ${diam / 3}`;
        }
        else {
            return `M  1 ${diam / 3} L 1 ${2 * diam / 3} L ${radius / 5} ${radius} L 1 ${diam / 3}`;
        }
    };

    var brushResizePath = function (d) {
        var e = +(d.type == "e"),
            x = e ? 1 : -1,
            y = radius;
        return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
    };

    g.selectAll(".handle--custom")
        .data([{ type: "w" }, { type: "e" }])
        .join(
            enter => enter.append("path")
                .attr("class", "handle--custom")
                .attr("fill", "#ddd")
                .attr("fill-opacity", 0.8)
                .attr("stroke", "#000")
                .attr("stroke-width", 1.5)
                .attr("cursor", "ew-resize")
                .attr("d", triangle)
        )
        .attr("display", s === null ? "none" : null)
        .attr("transform", s === null ? null : (d, i) => `translate(${s[i]},${slack})`)
}

/**
 * Line Chart
 */
class LineChart {
    constructor(svgContext, viewport, orientation = utils.Orientations.Vertical, margin) {
        this.id = "widget_" + utils.generateID();
        //
        this.svg = svgContext;
        // Axis
        this.svg.append('g')
            .attr('id', this.id + '_xaxis');
        this.svg.append('g')
            .attr('id', this.id + '_yaxis');
        //
        this.svg.append('g')
            .attr('id', this.id + '_data')
            .append('path');
        // Brush
        this.svg.append('g')
            .attr('id', this.id + '_brush');

        // text label for the x axis
        if (orientation == utils.Orientations.Vertical) {
            this.svg.append("text")
                .attr('id', this.id + 'Label')
                .attr("transform",
                    "translate(" + (viewport.width / 2) + " ," +
                    (viewport.height + margin.top + 18) + ")")
                .style("text-anchor", "middle")
                .style("alignment-baseline", "hanging");
        }
        else if (orientation == utils.Orientations.HorizontalLeft) {
            // text label for the y axis
            this.svg.append("text")
                .attr('id', this.id + 'Label')
                .attr("transform", "rotate(-90)")
                .attr("y", 63 - margin.left)
                .attr("x", 0 - (viewport.height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle");
        }

        //
        this.viewport = viewport;
        //
        this.data = undefined;
        this.needToUpdate = false;
        //
        this.showXAxis = true;
        this.showYAxis = true;
        this.showBrush = true;
        this.orientation = orientation;
    }

    /*
     * data = {'domainRange':[m,M], bins:[v1,v2,v3,...]}
     */
    setData(data) {
        if (data) {
            this.data = data;
            this.needToUpdate = true;
            //
            this.svg.select('#' + this.id + 'Label')
                .text(data.xLabel);
            //
            this.render();
        }
    }

    setBrushExtent(brushExtent) {
        this.brushExtent = brushExtent;
    }

    clear() {
        //TODO: clear svg if needed
        this.svg.select('#' + this.id + '_xaxis').selectAll('*').remove();
        this.svg.select('#' + this.id + '_yaxis').selectAll('*').remove();
        this.svg.select('#' + this.id + '_brush').selectAll('*').remove();
        this.svg.select('#' + this.id + '_data').select('path').attr('d', undefined);
        this.svg.select('#' + this.id + 'Label').text('');
        this.data = undefined
    }

    render() {
        if (this.needToUpdate && this.data) {
            this.clear();

            //
            if (this.orientation == utils.Orientations.Vertical) {
                var scaleX = d3.scaleLinear()
                    .domain(d3.extent(this.data.points, d => d[0]))
                    .range([0, this.viewport.width]);
                var scaleY = d3.scaleLinear()
                    .domain(d3.extent(this.data.points, d => d[1]))
                    .range([this.viewport.height, 0]);
                //draw line
                this.svg.select('#' + this.id + '_data')
                    .select('path')
                    .datum(this.data.points)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 2)
                    .attr("d", d3.line()
                        .x(function (d) { return scaleX(d[0]) })
                        .y(function (d) { return scaleY(d[1]) })
                    );

                //show axis
                if (this.showXAxis) {
                    const axis = d3.axisBottom(scaleX.nice()).ticks(4);
                    this.svg.select('#' + this.id + '_xaxis')
                        .attr('transform', `translate(0, ${this.viewport.height})`)
                        .call(axis);
                }
                if (this.showYAxis) {
                    const axis = d3.axisLeft(scaleY.nice()).ticks(1);
                    this.svg.select('#' + this.id + '_yaxis')
                        .attr('transform', `translate(0,0)`)
                        .call(axis);
                }
                //
                if (this.showBrush) {
                    var slack = 3;
                    var group = this.svg.select('#' + this.id + '_brush');
                    const brush = d3.brushX();
                    brush
                        .extent([[slack, slack], [this.viewport.width - slack, this.viewport.height - slack]])
                        .on("start brush end", _brushed.bind({ 'g': group, 'scale': scaleX, 'slack': slack, 'r': this.viewport.height / 2 - slack, 'brush': brush }));
                    group.call(brush);
                    if (this.brushExtent) {
                        const sx = this.brushExtent.map(scaleX);
                        group.call(brush.move, sx);
                    }
                }
            }
            // else if (this.orientation == utils.Orientations.HorizontalLeft) {
            //     var scaleY = d3.scaleLinear()
            //         .domain(this.data.domainRange)
            //         .rangeRound([this.viewport.height, 0]);
            //     var scaleX = d3.scaleLinear()
            //         .domain(d3.extent(this.data.bins))
            //         .rangeRound([0, this.viewport.width]);

            //     //draw line
            //     this.svg.select('#' + this.id + '_data')
            //         .select('path')
            //         .datum(this.data.bins)
            //         .attr("fill", "none")
            //         .attr("stroke", "steelblue")
            //         .attr("stroke-width", 2)
            //         .attr("d", d3.line()
            //             .x(function (d, i) { return scaleX(d) })
            //             .y(function (d, i) { return scaleY(i) })
            //         )

            //     //show axis
            //     if (this.showAxis) {
            //         const axis = d3.axisRight(scaleY);
            //         axis.ticks(10);
            //         this.svg.select('#' + this.id + '_axis')
            //             .attr('transform', `translate(${this.viewport.width},0)`)
            //             .call(axis);
            //     }
            // }
            // else if (this.orientation == utils.Orientations.HorizontalRight) {
            //     var scaleY = d3.scaleLinear()
            //         .domain(this.data.domainRange)
            //         .rangeRound([0, this.viewport.height]);
            //     var scaleX = d3.scaleLinear()
            //         .domain(d3.extent(this.data.bins))
            //         .rangeRound([this.viewport.width, 0]);

            //     //draw line
            //     this.svg.select('#' + this.id + '_data')
            //         .select('path')
            //         .datum(this.data.bins)
            //         .attr("fill", "none")
            //         .attr("stroke", "steelblue")
            //         .attr("stroke-width", 2)
            //         .attr("d", d3.line()
            //             .x(function (d, i) { return scaleX(d) })
            //             .y(function (d, i) { return scaleY(i) })
            //         )

            //     //show axis
            //     if (this.showAxis) {
            //         const axis = d3.axisLeft(scaleY);
            //         axis.ticks(10);
            //         this.svg.select('#' + this.id + '_axis')
            //             .attr('transform', `translate(0,0)`)
            //             .call(axis);
            //     }
            // }
        }
    }
}

/**
 * LineChartView
 */
class LineChartView {
    constructor(containerSelection, viewport, orientation = utils.Orientations.Vertical) {
        //
        this.id = "widget_" + utils.generateID();
        this.container = containerSelection.attr('id', 'lineChart' + this.id).style("width", "100%").style("height", "100%").style("display", "block");

        //
        var margin = undefined;
        if (orientation == utils.Orientations.Vertical)
            margin = { top: 5, right: 10, bottom: 40, left: 25 };
        else if (orientation == utils.Orientations.HorizontalLeft)
            margin = { top: 60, right: 35, bottom: 5, left: 2 };
        else if (orientation == utils.Orientations.HorizontalRight)
            margin = { top: 5, right: 5, bottom: 5, left: 30 };

        const outerWidth = viewport.width;
        const outerHeight = viewport.height;
        const width = outerWidth - margin.left - margin.right;
        const height = outerHeight - margin.top - margin.bottom;

        // Init SVG
        var svg = this.container.append('svg')
            .attr('width', outerWidth)
            .attr('height', outerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        //
        this.chart = new LineChart(svg, new utils.Viewport(0, 0, width, height), orientation, margin);
    }

    setData(dt) {
        this.chart.setData(dt);
    }

    setBrushExtent(extent) {
        this.chart.setBrushExtent(extent);
    }

    clear() {
        this.chart.clear();
    }

};

module.exports = {
    LineChart: LineChart,
    LineChartView: LineChartView
};

