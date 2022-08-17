var d3 = require("d3");
var glMatrix = require("gl-matrix");
var utils = require("./utils.js");
var glUtils = require("./glUtils.js");
var legend = require("./legend.js");
/**
 * ScatterplotView
 */
class ScatterplotView {
    constructor(containerSelection, viewport) {
        //
        this.id = "widget_" + utils.generateID();
        this.container = containerSelection.append('div').attr('id', 'scatter' + this.id);
        containerSelection.style('width', viewport.width + 'px')
            .style('height', viewport.height + 'px');
        //
        const margin = { top: 40, right: 10, bottom: 40, left: 45 };
        const outerWidth = viewport.width;
        const outerHeight = viewport.height;
        const width = outerWidth - margin.left - margin.right;
        const height = outerHeight - margin.top - margin.bottom;

        //
        this.currentColormap = 'blues';

        // Init SVG
        this.initSVG(outerWidth, outerHeight, width, height, margin);

        // Init Canvas
        this.initCanvas(width, height, margin);
    }

    initSVG(outerWidth, outerHeight, width, height, margin) {
        // Init Scales
        //TODO: think if we need to store these scales
        //      I assume that the range is never going to change
        this.xScale = d3.scaleLinear().range([0, width]).nice();
        this.yScale = d3.scaleLinear().range([height, 0]).nice();

        //
        var svg = this.container.append('svg:svg')
            .style('position', 'absolute')
            .attr('id', this.id + '_svg')
            .attr('width', outerWidth)
            .attr('height', outerHeight)
            .attr('class', 'svg-plot')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // axis groups
        svg.append('g')
            .attr('id', this.id + '_gxAxis')
            .attr('transform', `translate(0, ${height + 1})`);

        svg.append('g')
            .attr('id', this.id + '_gyAxis')
            .attr('transform', 'translate(-1, 0)');

        // legend group
        this.legendGroup = svg.append('g')
            .attr('id', this.id + '_legend')
            .attr('transform', `translate(${width / 2 - 160}, ${-margin.top / 1.1})`);

        // text label for the x axis
        svg.append("text")
            .attr('id', this.id + 'xLabel')
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top) + ")")
            .style("text-anchor", "middle")
            .text("Date");

        // text label for the y axis
        svg.append("text")
            .attr('id', this.id + 'yLabel')
            .attr("transform", "rotate(-90)")
            .attr("y", - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Value");

        //
        this.drawAxis();
        this.drawLegend();
    }

    drawAxis(xLabel = "", yLabel = "") {
        //
        var svg = this.container.select('#' + this.id + '_svg');
        // Init Axis
        const xAxis = d3.axisBottom(this.xScale).ticks(3);
        svg.select("#" + this.id + "_gxAxis")
            .call(xAxis)

        const yAxis = d3.axisLeft(this.yScale).ticks(3);
        svg.select("#" + this.id + "_gyAxis")
            .call(yAxis)

        //
        this.container.select('#' + this.id + 'xLabel')
            .text(xLabel);
        this.container.select('#' + this.id + 'yLabel')
            .text(yLabel);
    }

    initCanvas(width, height, margin) {
        var canvasChart = this.container.append('canvas')
            .attr('width', width)
            .attr('height', height)
            .style('position', 'absolute')
            .style('margin-left', margin.left + 'px')
            .style('margin-top', margin.top + 'px')
            .attr('class', 'canvas-plot');

        this.initGL(canvasChart.node());
    }

    initGL(canvas) {
        //
        this.gl = canvas.getContext("webgl2");
        //
        var ext = this.gl.getExtension('EXT_color_buffer_float');
        if (!ext) {
            console.log("sorry, can't render to floating point textures");
            return;
        }
        //
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        //
        this.shaderProgram = glUtils.getShader(this.gl, 'simple');
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition')
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                dataTextureUnit: this.gl.getUniformLocation(this.shaderProgram, 'utextureCoefs'),
                countsTextureUnit: this.gl.getUniformLocation(this.shaderProgram, 'utextureCounts'),
                colormapTexture: this.gl.getUniformLocation(this.shaderProgram, 'uColormapTexture'),
                minValueColormap: this.gl.getUniformLocation(this.shaderProgram, 'uMinValue'),
                maxValueColormap: this.gl.getUniformLocation(this.shaderProgram, 'uMaxValue'),
            },
        };

        //create buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [1, 1, 0, 1, 1, 0, 0, 0,];

        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(positions),
            this.gl.STATIC_DRAW);

        //Initialize data texture
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.dataTexture = texture;
        //
        texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.countTexture = texture;
        //
        texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.uncertaintyTexture = texture;

        //Initialize colormap texture
        const colorMaptexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, colorMaptexture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.colorMapTexture = colorMaptexture;
        //
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorMapTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        //
        var colormap = utils.getColormap(this.currentColormap);
        var numColors = colormap.length / 4;

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, numColors, 1, 0,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, colormap);
    }

    drawLegend(zDomainRange = [0, 1], zLabel = "") {
        var scale = d3.scaleQuantize().domain(zDomainRange).range(utils.getColormapD3(this.currentColormap));
        this.legendGroup.selectAll("*").remove();
        legend.Legend(this.legendGroup, scale, { 'title': zLabel });
    }

    /**
     * @param {'xDomainRange': [xMin,xMax],'yDomainRange': [yMin, yMax], 'xLabel':label,'yLabel':label,
     *  bins: [v1,v2,...], 'sparse':bool} dt 
     */
    setData(dt) {
        //
        this.xScale.domain(dt.xDomainRange);
        this.yScale.domain(dt.yDomainRange);
        this.drawAxis(dt.xLabel, dt.yLabel);
        //
        this.drawLegend(dt.zDomainRange, dt.zLabel);
        //
        this.zDomainRange = dt.zDomainRange;

        //set data texture
        var textureImage = new Float32Array(dt.bins);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.dataTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.R32F,
            dt.xRes, dt.yRes, 0, this.gl.RED, this.gl.FLOAT, textureImage);

        //set count texture
        textureImage = new Float32Array(dt.counts);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.countTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.R32F,
            dt.xRes, dt.yRes, 0, this.gl.RED, this.gl.FLOAT, textureImage);

        //
        this.render();
    }

    render() {
        // Tell WebGL to use our program when drawing
        this.gl.useProgram(this.programInfo.program);

        //
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        //matrices
        const projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0);
        const modelViewMatrix = glMatrix.mat4.create();

        // Set the shader uniforms
        ///matrices
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        ///colormap parameters
        this.gl.uniform1f(this.programInfo.uniformLocations.minValueColormap, this.zDomainRange[0]);
        this.gl.uniform1f(this.programInfo.uniformLocations.maxValueColormap, this.zDomainRange[1]);
        //textures
        ///data
        this.gl.activeTexture(this.gl.TEXTURE0); // Set the active texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.dataTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.dataTextureUnit, 0);
        //colormap
        this.gl.activeTexture(this.gl.TEXTURE1); // Set the active texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorMapTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.colormapTexture, 1);
        ///count
        this.gl.activeTexture(this.gl.TEXTURE2); // Set the active texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.countTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.countsTextureUnit, 2); // Bind our texture to the texture slot 0
        //
        const voffset = 0;
        const vertexCount = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, voffset, vertexCount);
    }
};

module.exports = {
    ScatterplotView: ScatterplotView
};
