"use strict";
function colorBlend(c1, c2, t) {
  return vec3(
    c1[0] * (1 - t) + c2[0] * t,
    c1[1] * (1 - t) + c2[1] * t,
    c1[2] * (1 - t) + c2[2] * t
  );
}
function midpoint(p1, p2) {
  return vec3(
    (p1[0] + p2[0]) / 2,
    (p1[1] + p2[1]) / 2,
    (p1[2] + p2[2]) / 2
  );
}
function pushOnCircle(p, center, radius) {
  let dir = subtract(p, center);
  let len = Math.sqrt(dot(dir, dir));
  if (len == 0) {
    return add(center, vec3(radius, 0, 0));
  }
  return add(center, scale(radius / len, dir));
}
class Triangle3D {
  constructor(p1, p2, p3, color1, color2, color3) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.color1 = color1;
    if (typeof(color2) == 'undefined') {
      this.color2 = color1;
    } else {
      this.color2 = color2;
    }
    if (typeof(color3) == 'undefined') {
      this.color3 = color1;
    } else {
      this.color3 = color3;
    }
  }
  subdivide(circleCenter = undefined, circleRadius = 1.0) {
    let TriangleList = [];
    let p1_2 = midpoint(this.p1, this.p2);
    let p2_3 = midpoint(this.p2, this.p3);
    let p3_1 = midpoint(this.p3, this.p1);
    let c1_2 = colorBlend(this.color1, this.color2, 0.5);
    let c2_3 = colorBlend(this.color2, this.color3, 0.5);
    let c3_1 = colorBlend(this.color3, this.color1, 0.5);
    if (circleCenter != undefined) {
      p1_2 = pushOnCircle(p1_2, circleCenter, circleRadius);
      p2_3 = pushOnCircle(p2_3, circleCenter, circleRadius);
      p3_1 = pushOnCircle(p3_1, circleCenter, circleRadius);
    }
    TriangleList.push(new Triangle3D(this.p1, p1_2, p3_1, this.color1, c1_2, c3_1));
    TriangleList.push(new Triangle3D(p1_2, this.p2, p2_3, c1_2, this.color2, c2_3));
    TriangleList.push(new Triangle3D(p3_1, p2_3, this.p3, c3_1, c2_3, this.color3));
    TriangleList.push(new Triangle3D(p1_2, p2_3, p3_1, c1_2, c2_3, c3_1));
    return TriangleList
  }
  draw(position_array, color_array) {
    drawTriangle3D(position_array, color_array, this.p1, this.p2, this.p3, [this.color1, this.color2, this.color3]);
  }
}
class sphere3D {
  constructor(center, radius, color1, color2, color3, color4, initialSubdivides = 0) {
    this.center = center;
    this.radius = radius;
    this.color1 = color1;
    if (typeof(color2) == 'undefined') {
      this.color2 = color1;
    } else {
      this.color2 = color2;
    }
    if (typeof(color3) == 'undefined') {
      this.color3 = color1;
    } else {
      this.color3 = color3;
    }
    if (typeof(color4) == 'undefined') {
      this.color4 = color1;
    } else {
      this.color4 = color4;
    }
    this.triangles = [];

    let p1 = pushOnCircle(vec3(0.0, 0.0, 1.0),this.center, this.radius)
    let p2 = pushOnCircle(vec3(0.0, (2*Math.sqrt(2.0)/3), -1.0/3),this.center, this.radius)
    let p3 = pushOnCircle(vec3(-Math.sqrt(6.0)/3, -Math.sqrt(2.0)/3, -1.0/3),this.center, this.radius)
    let p4 = pushOnCircle(vec3(Math.sqrt(6.0)/3, -Math.sqrt(2.0)/3, -1.0/3),this.center, this.radius)

    this.triangles.push(new Triangle3D(
      p1,
      p2,
      p3,
      this.color1,
      this.color2,
      this.color3
    ));
    this.triangles.push(new Triangle3D(
      p1,
      p3,
      p4,
      this.color1,
      this.color3,
      this.color4
    ));
    this.triangles.push(new Triangle3D(
      p1,
      p4,
      p2,
      this.color1,
      this.color4,
      this.color2
    ));
    this.triangles.push(new Triangle3D(
      p2,
      p4,
      p3,
      this.color2,
      this.color4,
      this.color3,
    ));
    this.divisions = 0;
    this.subdivide(initialSubdivides)
  }
  subdivide(target) {
    if (this.divisions > target) {
      let temp = new sphere3D(this.center, this.radius, this.color1, this.color2, this.color3, this.color4, target);
      this.triangles = temp.triangles;
      this.divisions = target;
    }
    while (this.divisions < target) {
      let newTriangles = [];
      for (let i = 0; i < this.triangles.length; i++) {
        let subdivided = this.triangles[i].subdivide(this.center, this.radius);
        newTriangles.push(...subdivided);
      }
      this.triangles = newTriangles;
      this.divisions++;
    }
  }
  draw(position_array, color_array) {
    for (let i = 0; i < this.triangles.length; i++) {
      this.triangles[i].draw(position_array, color_array);
    }
  }
}
class obj3D {
  constructor(information) {
    let vertices = information["vertices"];
    this.vertexes = [];
    for (let i = 0; i < vertices.length;) {
      this.vertexes.push(vec4(vertices[i++],vertices[i++],vertices[i++],vertices[i++]));
    }
    let faces = information["indices"];
    this.faces = [];
    for (let i = 0; i < faces.length;) {
      this.faces.push([faces[i++],faces[i++],faces[i++]]);
    }
    let colors = information["colors"];
    this.colors = [];
    for (let i = 0; i < colors.length;) {
      this.colors.push(vec4(colors[i++],colors[i++],colors[i++],colors[i++]));
    }
  }
  draw(position_array, color_array) {
    for (let i = 0; i < this.faces.length; i++) {
      let f = this.faces[i];
      let i1 = f[0];
      let i2 = f[1];
      let i3 = f[2];
      drawTriangle3D(position_array, color_array, this.vertexes[i1], this.vertexes[i2], this.vertexes[i3], [this.colors[i1], this.colors[i2], this.colors[i3]]);
    }
  }
}
class any3D{
  constructor(vertexes, colors, faces, texturePath = undefined, texcoords = []){
    this.vertexes = vertexes;
    this.texturePath = texturePath;
    this.texcoords = texcoords.length > 0
      ? texcoords
      : vertexes.map(vertex => vec2((vertex[0] + 4.0) / 8.0, (-vertex[2] - 1.0) / 20.0));
    this.textureBindGroup = undefined;
    if (typeof(colors) == 'undefined') {
      colors = [];
      for(let i = 0; i < vertexes.length; i+=2) {
        colors.push(vec4(1.0, 0.0, 1.0, 1.0));
        colors.push(vec4(0.0, 0.0, 0.0, 1.0));
      }
    }
    if (Array.isArray(colors) && colors.length == 0) {
      let template=[
        vec3(1.0,0.0,0.0),
        vec3(0.0,1.0,0.0),
        vec3(0.0,0.0,1.0),
        vec3(1.0,1.0,0.0),
        vec3(0.0,1.0,1.0),
        vec3(1.0,0.0,1.0),
        vec3(1.0,1.0,1.0),
        vec3(0.0,0.0,0.0),
      ]
      for (let i = 0; i < vertexes.length; i++) {
        colors.push(vec4(...template[i % template.length], 1.0));
      }
    }
    if (Array.isArray(colors) && colors.length > 0 && !Array.isArray(colors[0])) {
      let color = colors;
      colors = [];
      for(let i = 0; i < vertexes.length; i++) {
        colors.push(vec4(...color,1.0,1.0,1.0,1.0));
      }
    }
    if (colors.length != vertexes.length) {
      let len = colors.length;
      for (let i = len; i < vertexes.length; i++) {
        colors.push(colors[i % len]);
      }
    }
    for (let i = 0; i < colors.length; i++) {
      colors[i] = vec4(...colors[i],1.0,1.0,1.0,1.0)
    }
    this.colors = colors;
    this.faces = faces;
  }
  draw(position_array, color_array, texcoord_array){
    for (let i = 0; i < this.faces.length; i++) {
      let f = this.faces[i];
      let i1 = f[0];
      let i2 = f[1];
      let i3 = f[2];
      let c1 = this.colors[i1];
      let c2 = this.colors[i2];
      let c3 = this.colors[i3];
      drawTriangle3D(position_array, color_array, this.vertexes[i1], this.vertexes[i2], this.vertexes[i3], [c1, c2, c3]);
      texcoord_array.push(this.texcoords[i1], this.texcoords[i2], this.texcoords[i3]);
    }
  }
}

function add_vector(position_array, point, color_array, color)
{
  if (point.length == 3) {
    point = vec4(point, 1.0);
  }else if (point.length == 2) {
    point = vec4(point, 0.0, 1.0);
  }
  position_array.push(point);
  color_array.push(color);
}

function drawTriangle3D(position_array, color_array, p1, p2, p3, color){
  let color1,color2,color3;
  if (Array.isArray(color) && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
  }else{
    color1 = color;
    color2 = color;
    color3 = color;
  }
  add_vector(position_array, p1, color_array, color1);
  add_vector(position_array, p2, color_array, color2);
  add_vector(position_array, p3, color_array, color3);
}

function drawLine3D(position_array, color_array, p1, p2, width, color){
  let color1,color2;
  if (Array.isArray(color) && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
  }else{
    color1 = color;
    color2 = color;
  }
  let p1_, p2_, p3_, p4_, p5_, p6_, p7_, p8_;
  let dir = subtract(p2, p1);
  dir = normalize(dir);
  let up = vec3(0.0, 1.0, 0.0);
  if (Math.abs(dot(dir, up)) > 0.999) {
    up = vec3(0.0, 0.0, 1.0);
  }
  let right = cross(dir, up);
  right = normalize(right);
  right = scale(width/2, right);
  up = cross(right, dir);
  up = normalize(up);
  up = scale(width/2, up);
  p1_ = add(p1, add(right, up));
  p2_ = add(p1, subtract(right, up));
  p3_ = add(p1, subtract(scale(-1,right), up));
  p4_ = add(p1, subtract(scale(-1,right), scale(-1,up)));
  p5_ = add(p2, add(right, up));
  p6_ = add(p2, subtract(right, up));
  p7_ = add(p2, subtract(scale(-1,right), up));
  p8_ = add(p2, subtract(scale(-1,right), scale(-1,up)));
  drawCube3D(
    position_array,
    color_array,
    p1_, p2_, p3_, p4_,
    p5_, p6_, p7_, p8_,
    [
      color1, color1, color1, color1,
      color2, color2, color2, color2,
    ],
    false,
  );
}

function drawPlane3d(position_array, color_array, p1, p2, p3, p4, color){
  let color1,color2,color3,color4;
  if (Array.isArray(color) && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
    color4 = color[3 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
    color4 = vec3(1.0, 1.0, 1.0);
  }else{
    color1 = color;
    color2 = color;
    color3 = color;
    color4 = color;
  }
  drawTriangle3D(position_array, color_array, p1, p2, p3, [color1, color2, color3]);
  drawTriangle3D(position_array, color_array, p1, p3, p4, [color1, color3, color4]);
}

function drawCube3D(position_array, color_array, p1, p2, p3, p4, p5, p6, p7, p8, color, wireFrame){
  if (typeof(wireFrame) == 'undefined'){
    wireFrame = 0;
  }else if (typeof(wireFrame) == 'boolean'){
    wireFrame = wireFrame ? 0.01 : 0;
  }else{
    wireFrame = 0.0;
  }
  let color1,color2,color3,color4,color5,color6,color7,color8;
  if (Array.isArray(color) && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
    color4 = color[3 % color.length];
    color5 = color[4 % color.length];
    color6 = color[5 % color.length];
    color7 = color[6 % color.length];
    color8 = color[7 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
    color4 = vec3(1.0, 1.0, 0.0);
    color5 = vec3(0.0, 1.0, 1.0);
    color6 = vec3(1.0, 0.0, 1.0);
    color7 = vec3(1.0, 1.0, 1.0);
    color8 = vec3(0.1, 0.1, 0.1);
  }else{
    color1 = color;
    color2 = color;
    color3 = color;
    color4 = color;
    color5 = color;
    color6 = color;
    color7 = color;
    color8 = color;
  }
  if (wireFrame != 0.0) {
    const edges = [
      [p1, p2, color1, color2], [p2, p3, color2, color3],
      [p3, p4, color3, color4], [p4, p1, color4, color1],
      [p5, p6, color5, color6], [p6, p7, color6, color7],
      [p7, p8, color7, color8], [p8, p5, color8, color5],
      [p1, p5, color1, color5], [p2, p6, color2, color6],
      [p3, p7, color3, color7], [p4, p8, color4, color8],
    ];
    for (const [start, end, startColor, endColor] of edges) {
      add_vector(position_array, start, color_array, startColor);
      add_vector(position_array, end, color_array, endColor);
    }
  }else{
    drawPlane3d(position_array, color_array, p5, p6, p7, p8, [color5, color6, color7, color8]);
    drawPlane3d(position_array, color_array, p2, p3, p7, p6, [color2, color3, color7, color6]);
    drawPlane3d(position_array, color_array, p3, p4, p8, p7, [color3, color4, color8, color7]);
    drawPlane3d(position_array, color_array, p4, p1, p5, p8, [color4, color1, color5, color8]);
    drawPlane3d(position_array, color_array, p1, p2, p6, p5, [color1, color2, color6, color5]);
    drawPlane3d(position_array, color_array, p1, p2, p3, p4, [color1, color2, color3, color4]);
  }
}

function drawTetrahedron3D(position_array, color_array, p1, p2, p3, p4, color){
  let color1,color2,color3,color4;
  if (Array.isArray(color) && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
    color4 = color[3 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
    color4 = vec3(1.0, 1.0, 1.0);
  }else{
    color1 = color;
    color2 = color;
    color3 = color;
    color4 = color;
  }
  drawTriangle3D(position_array, color_array, p1, p2, p3, [color1, color2, color3]);
  drawTriangle3D(position_array, color_array, p1, p2, p4, [color1, color2, color4]);
  drawTriangle3D(position_array, color_array, p2, p3, p4, [color2, color3, color4]);
  drawTriangle3D(position_array, color_array, p1, p3, p4, [color1, color3, color4]);
}

function tetrahedronLines(position_array, color_array, p1, p2, p3, p4, color){
  let color1,color2,color3,color4;
  if (Array.isArray(color) && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
    color4 = color[3 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
    color4 = vec3(1.0, 1.0, 1.0);
  }else{
    color1 = color;
    color2 = color;
    color3 = color;
    color4 = color;
  }
  drawLine3D(position_array, color_array, p1, p2, 0.01, [color1, color2]);
  drawLine3D(position_array, color_array, p2, p3, 0.01, [color2, color3]);
  drawLine3D(position_array, color_array, p3, p1, 0.01, [color3, color1]);
  drawLine3D(position_array, color_array, p1, p4, 0.01, [color1, color4]);
  drawLine3D(position_array, color_array, p2, p4, 0.01, [color2, color4]);
  drawLine3D(position_array, color_array, p3, p4, 0.01, [color3, color4]);
}

var canvasColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
var uniformBuffer = undefined;
var textureSampler = undefined;
var textureView = undefined;
var texcoordBuffer = undefined;
var textureBindGroupLayout = undefined;
var bindGroup = undefined;

function createTextureFromBuffer(device, textureBuffer, width, height, bytesPerRow = 256 * Math.ceil(width * 4 / 256)) {
  const texture = device.createTexture({
    size: [width, height, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
    const encoder = device.createCommandEncoder();
  encoder.copyBufferToTexture(
    { buffer: textureBuffer, bytesPerRow: bytesPerRow, rowsPerImage: height },
    { texture: texture },
    [width, height, 1]
  );
  device.queue.submit([encoder.finish()]);
  return texture;
}

function setTextureBuffer(device, textureBuffer, width, height, bytesPerRow) {
  textureView = createTextureFromBuffer(
    device,
    textureBuffer,
    width,
    height,
    bytesPerRow
  ).createView();
  if (textureBindGroupLayout !== undefined) {
    bindGroup = device.createBindGroup({
      layout: textureBindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
      }, {
        binding: 1,
        resource: textureSampler,
      }, {
          binding: 2,
          resource: textureView,
        }],
      });
  }
}

async function createTextureBindGroup(device, imagePath) {
  const response = await fetch(imagePath);
  if (!response.ok) {
    throw new Error(`Could not load texture image: ${imagePath}`);
  }
  const bitmap = await createImageBitmap(await response.blob());
  const mipLevelCount = Math.floor(Math.log2(Math.max(bitmap.width, bitmap.height))) + 1;
  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height, 1],
    mipLevelCount: mipLevelCount,
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const mipCanvas = document.createElement("canvas");
  const mipContext = mipCanvas.getContext("2d");
  for (let mipLevel = 0; mipLevel < mipLevelCount; mipLevel++) {
    const width = Math.max(1, bitmap.width >> mipLevel);
    const height = Math.max(1, bitmap.height >> mipLevel);
    mipCanvas.width = width;
    mipCanvas.height = height;
    mipContext.drawImage(bitmap, 0, 0, width, height);
    device.queue.copyExternalImageToTexture(
      { source: mipCanvas, flipY: true },
      { texture: texture, mipLevel: mipLevel },
      [width, height, 1]
    );
  }
  bitmap.close();
  return device.createBindGroup({
    layout: textureBindGroupLayout,
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer },
    }, {
      binding: 1,
      resource: textureSampler,
    }, {
      binding: 2,
      resource: texture.createView(),
    }],
  });
}

function createSolidTexture(device, color) {
  const texture = device.createTexture({
    size: [1, 1, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture: texture },
    new Uint8Array(color),
    { bytesPerRow: 4 },
    [1, 1, 1]
  );
  return texture;
}

function readSlider(id) {
  return parseFloat(document.getElementById(id).value);
}

function setupSlider(id) {
  const slider = document.getElementById(id);
  const output = document.getElementById(id + "Value");
  const update = function() {
    output.value = slider.value;
    output.textContent = slider.value;
  };
  slider.addEventListener("input", update);
  update();
}

async function main_cube() {
  // console.log("Loading OBJ file...");
  // let obj_data = readOBJFile("pyramid.obj");
  const gpu = navigator.gpu;
  const adapter = await gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const canvas = document.getElementById("triple-canvas");
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });
  const wgslfile = "p2.wgsl";
  const wgslcode = await fetch(wgslfile).then(r => r.text());
  const wgsl = device.createShaderModule({
    code: wgslcode
  });

  //buffer data types
  const positionBufferLayout = {
    arrayStride: sizeof['vec4'],
    attributes: [{
      format: 'float32x4',
      offset: 0,
      shaderLocation: 0, // Position, see vertex shader
    }],
  };
  const colorBufferLayout = {
    arrayStride: sizeof['vec4'],
    attributes: [{
      format: 'float32x4',
      offset: 0,
      shaderLocation: 1, // Color, see vertex shader
    }],
  };
  const texcoordBufferLayout = {
    arrayStride: sizeof['vec2'],
    attributes: [{
      format: 'float32x2',
      offset: 0,
      shaderLocation: 2,
    }],
  };
  
  //pipeline setup
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: wgsl,
    entryPoint: 'main_vs',
    buffers: [positionBufferLayout, colorBufferLayout, texcoordBufferLayout], },
    fragment: { module: wgsl,
    entryPoint: 'main_fs',
    targets: [{ format: canvasFormat }], },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
      frontFace: 'ccw',
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    },
  });

  
  uniformBuffer = device.createBuffer({
    size: sizeof['mat4'] + sizeof['vec4'] * 7,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  textureSampler = device.createSampler({
    addressModeU: "repeat",
    addressModeV: "repeat",
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "linear",
    maxAnisotropy: 1,
  });
  textureView = createSolidTexture(device, [255, 255, 255, 255]).createView();

  textureBindGroupLayout = pipeline.getBindGroupLayout(0);
  bindGroup = device.createBindGroup({
    layout: textureBindGroupLayout,
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer }
    }, {
      binding: 1,
      resource: textureSampler,
    }, {
      binding: 2,
      resource: textureView,
    }],
  });

  
  // console.log(await obj_data)
  // console.log("OBJ file parsed.");
  // obj = new obj3D(await obj_data);
  // console.log("OBJ file loaded.");

  obj.push(new any3D(
    [// vertices
      vec3(-4.0,-1.0,- 1.0),
      vec3( 4.0,-1.0,- 1.0),
      vec3( 4.0,-1.0,-21.0),
      vec3(-4.0,-1.0,-21.0),
    ],
    [vec4(1.0, 1.0, 1.0, 1.0)],//colors
    [[0, 1, 2],[0, 2, 3]],//indices
    "squares.png",//texture path
    [//texcoords
      vec2(-1.5, 0.0),
      vec2(2.5, 0.0),
      vec2(2.5, 10.0),
      vec2(-1.5, 10.0),
    ]
  ));

  for (const object of obj) {
    object.textureBindGroup = object.texturePath
      ? await createTextureBindGroup(device, object.texturePath)
      : bindGroup;
  }

  const eye = vec3(0.0, 0.0, 0.0);
  const lookat = vec3(0.0, -1.0, -8.0);
  const up = vec3(0.0, 1.0, 0.0);
  camera = new Camera(eye, lookat, up, new Projector(true, 90, 512/512, 0.1, 10.0));

  device.queue.writeBuffer(uniformBuffer, 0, camera.Get());
  requestAnimationFrame(
    render.bind(
      null,
      device,
      context,
      pipeline,
    )
  );
}

window.onload = function() {
  ["kd", "ks", "shininess", "Le", "La"].forEach(setupSlider);
  main_cube();
};


let sphere = new sphere3D(
  vec3(0.0, 0.0, 0.0),
  1.0,
  vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 1.0)
);
let resetBuff = true;
var colorBuffer = undefined;
var positionBuffer = undefined;
var depthTexture = undefined;
var positions_org = [];
var colors_org = [];
var texcoords_org = [];
var objectDrawRanges = [];
let positions = [];
var oldTime = 0;
var obj = [];

let camera = undefined;

async function render(device, context, pipeline, timestamp){
  // Update animation state
  const seconds = timestamp / 1000;
  let frameRate = 1 / (seconds - oldTime);
  if (frameRate < 5) {
    frameRate = Math.floor(frameRate * 10) / 10;
  }else{
    frameRate = Math.floor(frameRate);
  }
  document.getElementById("frameRate").textContent = frameRate;
  oldTime = seconds;

  device.queue.writeBuffer(uniformBuffer, 0, camera.Get());

  const lightDirection = new Float32Array(
    /*mult(rotate(-seconds * 20, vec3(0.1, -1.0, -0.1)),*/ vec4(0.0, 0.0, -1.0, 0.0)//)
  );
  const lightEmission = new Float32Array([readSlider("Le"), readSlider("Le"), readSlider("Le"), 0.0]);
  const lightAmbient = new Float32Array([readSlider("La"), readSlider("La"), readSlider("La"), 0.0]);
  const material = new Float32Array([
    readSlider("kd"),
    readSlider("ks"),
    readSlider("shininess"),
    0.0,
  ]);
  let cameraEye = camera.eyePos.Get();
  const diffuseColor = new Float32Array([0.2, 0.55, 1.0, 0.0]);
  const specularColor = new Float32Array([1.0, 1.0, 1.0, 0.0]);
  const eyePosition = new Float32Array([...vec3(cameraEye), 0.0]);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'], lightDirection);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'] + 16, lightEmission);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'] + 32, lightAmbient);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'] + 48, diffuseColor);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'] + 64, specularColor);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'] + 80, material);
  device.queue.writeBuffer(uniformBuffer, sizeof['mat4'] + 96, eyePosition);

  const encoder = device.createCommandEncoder();
  if (depthTexture === undefined || depthTexture.width !== context.canvas.width || depthTexture.height !== context.canvas.height) {
    depthTexture = device.createTexture({
      size: [context.canvas.width, context.canvas.height, 1],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
  
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
      clearValue: canvasColor
    }],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });

  if (resetBuff) {
    positions_org = [];
    colors_org = [];
    texcoords_org = [];
    objectDrawRanges = [];
    obj.forEach(o => {
      const firstVertex = positions_org.length;
      o.draw(positions_org, colors_org, texcoords_org);
      objectDrawRanges.push({
        object: o,
        firstVertex: firstVertex,
        vertexCount: positions_org.length - firstVertex,
      });
    });
    // sphere.draw(positions_org, colors_org);
    document.getElementById("verts").textContent = positions_org.length / 3;
  }resetBuff = false;

  if (positions_org.length === 0) {
    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(
      render.bind(
        null,
        device,
        context,
        pipeline,
      )
    );
    return;
  }

  let flatPos = flatten(positions_org);
  let flatCol = flatten(colors_org);
  let flatTexcoord = flatten(texcoords_org);

  if (resetBuff || positionBuffer === undefined) {
    positionBuffer = device.createBuffer({
      size: flatPos.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }
  if (resetBuff || colorBuffer === undefined) {
    colorBuffer = device.createBuffer({
      size: flatCol.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }
  if (resetBuff || texcoordBuffer === undefined) {
    texcoordBuffer = device.createBuffer({
      size: flatTexcoord.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }
  resetBuff = false;

  device.queue.writeBuffer(positionBuffer, 0, flatPos);
  device.queue.writeBuffer(colorBuffer, 0, flatCol);
  device.queue.writeBuffer(texcoordBuffer, 0, flatTexcoord);

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, positionBuffer);
  pass.setVertexBuffer(1, colorBuffer);
  pass.setVertexBuffer(2, texcoordBuffer);
  objectDrawRanges.forEach(range => {
    pass.setBindGroup(0, range.object.textureBindGroup || bindGroup);
    pass.draw(range.vertexCount, 1, range.firstVertex);
  });
  pass.end();
  device.queue.submit([encoder.finish()]);

  requestAnimationFrame(
    render.bind(
      null,
      device,
      context,
      pipeline,
    )
  );
}