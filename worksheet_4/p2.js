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
async function main_cube() {
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
  const wgslfile = "../p3d_simple.wgsl";
  const wgslcode = await fetch(wgslfile).then(r => r.text());
  const wgsl = device.createShaderModule({
    code: wgslcode
  });

  //buffer data types
  const positionBufferLayout = {
    arrayStride: sizeof['vec4'],
    attributes: [{
      format: 'float32x3',
      offset: 0,
      shaderLocation: 0, // Position, see vertex shader
    }],
  };
  const colorBufferLayout = {
    arrayStride: sizeof['vec3'],
    attributes: [{
      format: 'float32x3',
      offset: 0,
      shaderLocation: 1, // Color, see vertex shader
    }],
  };
  
  //pipeline setup
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: wgsl,
    entryPoint: 'main_vs',
    buffers: [positionBufferLayout, colorBufferLayout], },
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

  const eye = vec3(0.0, 0.0, -3.0);
  const lookat = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);
  const M_st = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.5,
    0.0, 0.0, 0.0, 1.0,
  );
  const projectionMatrix = perspective(45, 512/512, 0.1, 10.0);
  const view = lookAt(eye, lookat, up);
  const mvp = mult(M_st, mult(projectionMatrix, view));
  
  const uniformBuffer = device.createBuffer({
    size: sizeof['mat4'],
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer }
    }],
  });

  device.queue.writeBuffer(uniformBuffer, 0, flatten(mvp));
  requestAnimationFrame(
    render.bind(
      null,
      device,
      context,
      pipeline,
      bindGroup,
    )
  );
}

window.onload = function() {
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
let positions = [];
var oldTime = 0;
function render(device, context, pipeline, bindGroup, timestamp){
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
    positions = [];
    sphere.draw(positions_org, colors_org);
    positions = Array.from(positions_org);
  }
  for (let i = 0; i < positions_org.length; i++) {
    positions[i] = mult(rotateY(seconds * 30), positions_org[i]);
  }

  if (positions.length === 0) {
    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(
      render.bind(
        null,
        device,
        context,
        pipeline,
        bindGroup,
      )
    );
    return;
  }

  let flatPos = flatten(positions);
  let flatCol = flatten(colors_org);

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
  resetBuff = false;

  device.queue.writeBuffer(positionBuffer, 0, flatPos);
  device.queue.writeBuffer(colorBuffer, 0, flatCol);

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, positionBuffer);
  pass.setVertexBuffer(1, colorBuffer);
  pass.draw(positions.length);
  pass.end();
  device.queue.submit([encoder.finish()]);

  requestAnimationFrame(
    render.bind(
      null,
      device,
      context,
      pipeline,
      bindGroup,
    )
  );
}