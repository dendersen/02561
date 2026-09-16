"use strict";
window.onload = function() { main(); }

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

function drawLine3D(position_array, color_array, p1, p2, color){
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
    wireFrame = false;
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
  if (wireFrame) {
    // Draw wireframe
  }else{
    drawPlane3d(position_array, color_array, p1, p2, p3, p4, [color1, color2, color3, color4]);
    drawPlane3d(position_array, color_array, p5, p6, p7, p8, [color1, color2, color3, color4]);
    drawPlane3d(position_array, color_array, p1, p2, p6, p5, [color1, color2, color3, color4]);
    drawPlane3d(position_array, color_array, p2, p3, p7, p6, [color1, color2, color3, color4]);
    drawPlane3d(position_array, color_array, p3, p4, p8, p7, [color1, color2, color3, color4]);
    drawPlane3d(position_array, color_array, p4, p1, p5, p8, [color1, color2, color3, color4]);
  }
}
var VertexArray = [];
var VertexColorArray = [];
var canvasColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
async function main()
{
  const gpu = navigator.gpu;
  const adapter = await gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const canvas = document.getElementById('my-canvas');
  const context = canvas.getContext('webgpu');
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });
  const wgslfile = "p1.wgsl";
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
    primitive: { topology: 'triangle-list', },
  });

  const eye = vec3(2.0, 2.0, 2.0);
  const lookat = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);
  const M_st = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.5,
    0.0, 0.0, 0.0, 1.0,
  );
  const projection = ortho(-1.0, 1.0, -1.0, 1.0, 0.1, 10.0);
  const view = lookAt(eye, lookat, up);
  const mvp = mult(M_st, mult(projection, view));
  
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

  const encoder = device.createCommandEncoder();
  
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
      clearValue: canvasColor
    }]
  });
  drawCube3D(VertexArray, VertexColorArray, 
    vec3(1.0, 1.0, 1.0),
    vec3(0.0, 1.0, 1.0),
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 0.0, 1.0),
    vec3(1.0, 1.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 0.0),
    vec3(1.0, 0.0, 0.0),
    [vec3(0.0, 0.0, 0.0)],
    true
  );
  const positionBuffer = device.createBuffer({
    size: flatten(VertexArray).byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const colorBuffer = device.createBuffer({
    size: flatten(VertexColorArray).byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(positionBuffer, 0, flatten(VertexArray));
  device.queue.writeBuffer(colorBuffer, 0, flatten(VertexColorArray));

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, positionBuffer);
  pass.setVertexBuffer(1, colorBuffer);
  pass.draw(VertexArray.length);
  pass.end();
  device.queue.submit([encoder.finish()]);
}