console.log('webgl.js loaded')

let pairCounter = 0

// shader source
const vsSource = document.getElementById('vsSource').innerText
const fsSource = document.getElementById('fsSource').innerText

// canvas
const canvas = document.createElement('canvas')
canvas.width = 20
canvas.height = canvas.width
document.body.append(canvas)

let gl = canvas.getContext('webgl',{antialias:false})//premultipliedAlpha:false,alpha:false
if(!gl){
	gl = canvas.getContext('experimental-webgl')
}
if(!gl){
	alert('ERROR: webgl not supported.')
}

gl.viewport(0,0,canvas.width,canvas.height)
clear()

// program
const program = buildProgram()
gl.useProgram(program)



// location
// attrib
const attribLocations = []
for(let i=0;i<gl.getProgramParameter(program,gl.ACTIVE_ATTRIBUTES);i++){
	attribName = gl.getActiveAttrib(program,i).name
	attribLocations[attribName] = gl.getAttribLocation(program,attribName)
}

const uniformLocations = []
for(let i=0;i<gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);i++){
	uniformName = gl.getActiveUniform(program,i).name
	uniformLocations[uniformName] = gl.getUniformLocation(program,uniformName)
}


// Data  ORIGINAL
let data = [
	0,0,1,1,1,1,
	1,0,1,1,0,1,
	0,1,1,0,1,1,
	0,0,1,1,1,1,
	1,0,1,1,0,1,
	1,1,1,1,1,1,
]
// ORIGINAL DATA
// Buffer
const dataBuffer = gl.createBuffer()
preprocessingBind(1)

// FOR POST PROCESSING
// Data   SCREEN SIZE
let data2 = [
	-1,-1,	0,0,
	1,-1,		1,0,
	-1,1,		0,1,
	-1,1,		0,1,
	1,-1,		1,0,
	1,1,		1,1,
]

// METHOD 2
const data2Buffer = gl.createBuffer()
postprocessingBind(1)


// TEXTURES &


const textures = []
const fbs = []

for(let i=0;i<2;i++){
	textures[i] = buildTexture(null)
	fbs[i] = buildFramebuffer(textures[i])
}
updateTexture(textures[0],buildData())		// WRITE INTO THE TEXTURES[0]
updateTexture(textures[1],buildData(1))

gl.uniform1f(uniformLocations.u_RadInv,2/canvas.width)
gl.uniform1f(uniformLocations.u_PixSize,1/canvas.width)
// gl.bindFramebuffer(gl.FRAMEBUFFER,null)			// canvas
// preprocessingBind(0)										// enable/disable
// render(data.length/6)										// ONLY DRAW RECT ()
// read()

// // Render red pixel from texture onto canvas
// postprocessingBind(0)										// Bind pos, TEXCOORDS
// gl.bindTexture(gl.TEXTURE_2D,textures[0])		//select textures[0]
// render(data.length/4)
// read()
// // setTexFramePair(pairCounter)
// // pairCounter++
// // pairCounter=pairCounter%2

gl.uniform1i(uniformLocations.u_RenderTex,false)
preprocessingBind(0)											// enable
gl.bindFramebuffer(gl.FRAMEBUFFER,fbs[0])	// draw to textures[0]
gl.bindTexture(gl.TEXTURE_2D,textures[1])	// prevent feedback LOOP
render(data.length/6)		// draw TRIANGLES (no texture)
read()
// gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA)

gl.uniform1i(uniformLocations.u_RenderTex,true)			// IMPORTANT
postprocessingBind(0)
gl.bindFramebuffer(gl.FRAMEBUFFER,null)		// draw to Canvas
gl.bindTexture(gl.TEXTURE_2D,textures[0])	// Use textures[0] 
render(data2.length/4)	//
read()


// NOTES:
// textures[0] DID NOT get 255 Alpha after triangle and red dot became one.
// Only after postprocessingBind can the red dot be created?
// FALSE, Can render ONTO the texture
// If rendering a texture onto something, ALPHA will be 255?

// // gl.clear(gl.COLOR_BUFFER_BIT)
// gl.bindFramebuffer(gl.FRAMEBUFFER,fbs[0])	// WRITE INTO TEXTURES[0]
// // clear()
// // gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)

// gl.bindTexture(gl.TEXTURE_2D,textures[1])	// PREVENTS FEEDBACK LOOP
// render(data.length/5)
// read()
// // gl.bindTexture(gl.TEXTURE_2D,textures[0])
// // postprocessingBind(0)
// // // preprocessingBind(0)
// // renderToCanvas(data2.length/4)
// // read()


/* WORKS */
/* 

gl.bindFramebuffer(gl.FRAMEBUFFER,fbs[0])
gl.bindTexture(gl.TEXTURE_2D,textures[1])
render()
read()

gl.bindTexture(gl.TEXTURE_2D,textures[0])
postprocessingBind(0)
// preprocessingBind(0)
renderToCanvas()
read()
*/

// FUNCTIONS
function clear(){
	gl.clearColor(0.5,0.4,0.7,1)
	gl.clear(gl.COLOR_BUFFER_BIT)
}

function postprocessingBind(shouldBuffer=0){
	gl.bindBuffer(gl.ARRAY_BUFFER,data2Buffer)
	if(shouldBuffer)
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data2),gl.STATIC_DRAW)

	// pointer
	gl.vertexAttribPointer(
		attribLocations.a_Position,
		2,
		gl.FLOAT,
		0,
		4*Float32Array.BYTES_PER_ELEMENT,
		0,
	)
	gl.vertexAttribPointer(
		attribLocations.a_TexCoord,
		2,
		gl.FLOAT,
		0,
		4*Float32Array.BYTES_PER_ELEMENT,
		2*Float32Array.BYTES_PER_ELEMENT,
	)
	gl.enableVertexAttribArray(attribLocations.a_Position)
	gl.enableVertexAttribArray(attribLocations.a_TexCoord)
	gl.disableVertexAttribArray(attribLocations.a_Color)	// IMPORTANT
}

function preprocessingBind(shouldBuffer=0){
	gl.bindBuffer(gl.ARRAY_BUFFER,dataBuffer)
	
	if(shouldBuffer)
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW)

	// pointer
	gl.vertexAttribPointer(
		attribLocations.a_Position,
		2,
		gl.FLOAT,
		0,
		6*Float32Array.BYTES_PER_ELEMENT,
		0,
	)
	gl.vertexAttribPointer(
		attribLocations.a_Color,
		4,
		gl.FLOAT,
		0,
		6*Float32Array.BYTES_PER_ELEMENT,
		2*Float32Array.BYTES_PER_ELEMENT,
	)
	gl.enableVertexAttribArray(attribLocations.a_Position)
	gl.enableVertexAttribArray(attribLocations.a_Color)
	gl.disableVertexAttribArray(attribLocations.a_TexCoord)
}



function read(){
	const readData = new Uint8Array(canvas.width*canvas.height*4)
	gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,readData)
	console.log('readData')
	console.log(readData)
}

function updateTexture(tex,data){
	gl.bindTexture(gl.TEXTURE_2D,tex)
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,data)
}

function render(len){
	gl.drawArrays(gl.TRIANGLES,0,len)
}

function renderToCanvas(len){
	gl.bindFramebuffer(gl.FRAMEBUFFER,null)
	// gl.drawArrays(gl.POINTS,0,data.length/5)
	gl.drawArrays(gl.TRIANGLES,0,len)
}

function buildData(completelyNull=0){
	const data = new Uint8Array(canvas.width*canvas.height*4)
	const row = canvas.height-1
	const col = 0
	for(let i=0;i<canvas.width*canvas.height*4;i+=4){
		data[i]		=	0
		data[i+1]	=	0
		data[i+2]	=	0
		data[i+3]	=	0
	}
	if(!completelyNull){
		data[row*canvas.width*4 + col*4]		=	255
		data[row*canvas.width*4 + col*4+1]	=	0
		data[row*canvas.width*4 + col*4+2]	=	0
		data[row*canvas.width*4 + col*4+3]	=	255
	}
	return data
}

function setTexFramePair(i){
	gl.bindTexture(gl.TEXTURE_2D,textures[i])
	gl.bindFramebuffer(gl.FRAMEBUFFER,fbs[(i+1)%2])
}

function buildFramebuffer(tex){
	const fb = gl.createFramebuffer()
	gl.bindFramebuffer(gl.FRAMEBUFFER,fb)
	gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0)

	return fb
}


function buildTexture(data){
	const texture = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D,texture)
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,data)

	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST)
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST)
	return texture
}




function buildShader(type,source){
	const shader = gl.createShader(type)
	gl.shaderSource(shader,source)
	gl.compileShader(shader)
	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
		throw new Error('ERROR: compiling shader of type '+type+' . Info: '+gl.getShaderInfoLog(shader))
	}
	return shader
}

function buildProgram(){
	const program = gl.createProgram()
	gl.attachShader(program,buildShader(gl.VERTEX_SHADER,vsSource))
	gl.attachShader(program,buildShader(gl.FRAGMENT_SHADER,fsSource))
	gl.linkProgram(program)
	gl.validateProgram(program)

	if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
		throw new Error('ERROR: linking program. Info: '+gl.getProgramInfoLog(program))
	}
	if(!gl.getProgramParameter(program,gl.VALIDATE_STATUS)){
		throw new Error('ERROR: validating program. Info: '+gl.getProgramInfoLog(program))
	}
	return program
}
