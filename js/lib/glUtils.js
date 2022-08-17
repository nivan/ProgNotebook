/**
 * WebGL Shaders
 */

const vsSource = `#version 300 es
 precision highp float;
 
  in vec2 aVertexPosition;
 
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
 
  out vec2 textureCoords;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition,0,1);
    textureCoords = aVertexPosition;
  }
  `;

const fsSource = `#version 300 es
 precision highp float;
 uniform sampler2D utextureCoefs;
 uniform sampler2D utextureCounts;
 uniform sampler2D uColormapTexture;
 uniform float uMinValue;
 uniform float uMaxValue;
 in vec2 textureCoords;    
 out vec4 frag_color;
 
     float range(float _minVal, float _maxVal, float _val){
         return clamp((_val - _minVal)/(_maxVal - _minVal),0.0,1.0);
     }
 
      void main() {
         float count = texture(utextureCounts,textureCoords).r;
         if(count < 0.1){
             discard;
         }
         else{
         float value = texture(utextureCoefs, textureCoords).r;
         float normCoord = range(uMinValue,uMaxValue,value);
         frag_color = texture(uColormapTexture, vec2(normCoord,0.5));
         }
      }
    `;

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function getShader(gl, name) {
    if (name == 'simple')
        return initShaderProgram(gl, vsSource, fsSource);
    else
        return undefined;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

module.exports = {
    initShaderProgram: initShaderProgram,
    getShader: getShader
};
