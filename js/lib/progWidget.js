var d3 = require("d3");
var lineWidgets = require('./codeLineChart.js');
var scatWidgets = require('./codeScatterplotChart.js');
var myUtils = require('./utils.js');
var progress = require('./progressbar.js');

class ProgWidget {
    constructor(container, parent) {
        this.container = container;
        this.parent = parent;
        this.install();
    }

    install() {
        //
        var wrapper = this.container.append('div').attr('class', 'wrapper');
        //
        var top = wrapper.append('div').attr('class', 'top');
        var four = top.append('div').attr('class', 'four').append("fieldset");
        four.append('legend').text('Visualization');
        var options2 = [{ 'value': 'basic', 'name': 'visualize', 'text': 'Basic', 'id': 'visBasic' },
        { 'value': 'uncertainty', 'name': 'visualize', 'text': 'Uncertainty', 'id': 'visUncertainty' },
        { 'value': 'contour', 'name': 'visualize', 'text': 'Contour', 'id': 'visCountour' }];
        var divs2 = four.selectAll('div')
            .data(options2)
            .enter()
            .append("div");
        divs2.append("input")
            .attr('type', 'radio')
            .attr('value', d => d['value'])
            .attr('id', d => d['id'])
            .attr('name', d => d['name']);
        divs2.append("label")
            .attr('for', d => d['id'])
            .text(d => d['text']);
        divs2.select('#visBasic').attr("checked", true);

        //
        var five = top.append('div').attr('class', 'five').append("fieldset");
        five.append('legend').text('Smooth');
        options2 = [{ 'value': 'none', 'name': 'smooth', 'text': 'None', 'id': 'smoothNone' },
        { 'value': 'gauss', 'name': 'smooth', 'text': 'Gauss', 'id': 'smoothGauss' },
        { 'value': 'kde', 'name': 'smooth', 'text': 'KDE', 'id': 'smoothKDE' }];
        var divs2 = five.selectAll('div')
            .data(options2)
            .enter()
            .append("div");
        divs2.append("input")
            .attr('type', 'radio')
            .attr('value', d => d['value'])
            .attr('id', d => d['id'])
            .attr('name', d => d['name']);
        divs2.append("label")
            .attr('for', d => d['id'])
            .text(d => d['text']);
        divs2.select('#smoothNone').attr("checked", true);

        //
        var six = top.append('div').attr('class', 'six').append("fieldset");
        six.append('legend').text('Progress');
        this.progressBar = new progress.ProgressBar(six, new myUtils.Viewport(0, 0, 187, 40), 0, 100);
        // six.append('b').text('Missing X: ');
        // six.append('br');
        // six.append('b').text('Missing Y: ');
        // six.append('br');
        // six.append('b').text('Both: ');

        //
        var seven = top.append('div').attr('class', 'seven');
        seven.style('text-align', 'center').style('align-items', 'center');
        seven.append('input').attr("type", "button").attr("value", "Peel").on('click', this.peelClick.bind(this));

        //
        var bottom = wrapper.append('div').attr('class', 'bottom');
        var divChart = bottom.append('div').attr('class', 'left').attr('id', 'chart');
        var right = bottom.append('div').attr('class', 'right');

        var divMarginalX = right.append('div').attr('id', 'divMarginalX');
        var divMarginalY = right.append('div').attr('id', 'divMarginalY');
        var divMarginalZ = right.append('div').attr('id', 'divMarginalZ');

        //
        this.marginalX = new lineWidgets.LineChartView(divMarginalX,
            new myUtils.Viewport(0, 0, 300, 120));
        this.marginalY = new lineWidgets.LineChartView(divMarginalY,
            new myUtils.Viewport(0, 0, 300, 120));
        this.marginalZ = new lineWidgets.LineChartView(divMarginalZ,
            new myUtils.Viewport(0, 0, 300, 120));
        this.scatterplot = new scatWidgets.ScatterplotView(divChart,
            new myUtils.Viewport(0, 0, 450, 480));
    }

    peelClick() {
        this.parent.signalStopProgression();
    }

    setProgress(n) {
        this.progressBar.setState(n);
    }

    setMarginals(mx, my, mz) {
        //each marginal is of the form {"points":[[x,y],[x,y],...],"xLabel":"label","yLabel":"label"}
        this.marginalX.setData(mx);
        this.marginalY.setData(my);
        this.marginalZ.setData(mz);
    }

    setScatData(newData) {
        //{'xDomainRange': [xMin,xMax],'yDomainRange': [yMin, yMax], 'xLabel':label,'yLabel':label,
        // bins: [v1,v2,...], 'sparse':bool}
        this.scatterplot.setData(newData);
    }

    setMissingData() {
        //pass
    }

    clear() {
        this.scatterplot.clear();
        this.marginalX.clear();
        this.marginalY.clear();
        this.marginalZ.clear();
    }
}

module.exports = {
    ProgWidget: ProgWidget
};
