function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

const Orientations = Object.freeze({
    HorizontalLeft: Symbol("Horizontal"),
    HorizontalRight: Symbol("Horizontal"),
    Vertical: Symbol("Vertical")
});

function generateID() {
    return getRandomInt(0, 10000000);
}

/**
 * Colormaps
 */

function getColormapD3(cName) {
    if (cName == 'testeRGB') {
        return ['red', 'green', 'blue'];
    }
    else if (cName == 'blues') {
        return ['rgb(241, 238, 246)', 'rgb(189, 201, 225)', 'rgb(116, 169, 207)',
            'rgb(43, 140, 190)', 'rgb(4, 90, 141)'];
    }
    else {
        return undefined;
    }
}

function getColormap(cName) {
    if (cName == 'testeRGB') {
        return new Uint8Array([
            255, 0, 0, 255,
            0, 255, 0, 255,
            0, 0, 255, 255,
        ]);
    }
    else if (cName == 'blues') {
        return new Uint8Array([
            241, 238, 246, 255,
            189, 201, 225, 255,
            116, 169, 207, 255,
            43, 140, 190, 255,
            4, 90, 141, 255,
        ]);
    }
    else {
        return undefined;
    }
}

/**
 * Viewport
 */
class Viewport {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * @param {'top':num,'bottom':num,'left':num,'right':num} margin 
     */
    subtractMargin(margin) {
        return new Viewport(this.x + margin.left, this.y + margin.top,
            this.width - margin.left - margin.right,
            this.height - margin.bottom - margin.top);
    }

    right() {
        return this.x + this.width;
    }

    top() {
        return this.y + this.height;
    }
}

module.exports = {
    getRandomInt: getRandomInt,
    Orientations: Orientations,
    generateID: generateID,
    Viewport: Viewport,
    getColormap: getColormap,
    getColormapD3: getColormapD3
};
