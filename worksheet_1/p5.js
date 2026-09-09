"use strict";
window.onload = function() { main(); }

function add_point(array, point, color_array, color)
{
  array.push(point);
  color_array.push(color);
}

/**
 * 
 * @param {*} position_array array of vertexces
 * @param {*} color_array array of vertex colors
 * @param {*} p1 point 1
 * @param {*} p2 point 2
 * @param {*} p3  point 3
 * @param {*} color array of colors or single color
 */
function add_triangle(position_array, color_array, p1, p2, p3, color){
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
  add_point(position_array, p1, color_array, color1);
  add_point(position_array, p2, color_array, color2);
  add_point(position_array, p3, color_array, color3);
}

let rotate_point = function(center, rotation, p){
  let x = p[0] - center[0];
  let y = p[1] - center[1];
  let x_new = x * Math.cos(rotation) - y * Math.sin(rotation);
  let y_new = x * Math.sin(rotation) + y * Math.cos(rotation);
  return vec2(x_new + center[0], y_new + center[1]);
}

function triangle_wave(value){
  return 
}

/**
 * 
 * @param {*} position_array array of vertexces
 * @param {*} color_array array of vertex colors
 * @param {*} p1 point 1
 * @param {*} p2 point 2
 * @param {*} p3 point 3
 * @param {*} p4 point 4
 * @param {*} color array of colors or single color
 * @param {*} rotation rotation angle (radians) of the square around its center
 */
function add_square(position_array, color_array, p1, p2, p3, p4, color, rotation){
  let color1,color2,color3,color4;
  let isArray = Array.isArray(color) && color.length > 0 && Array.isArray(color[0]);
  if (isArray && color.length > 0){
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
    color4 = color[3 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
    color4 = vec3(1.0, 1.0, 0.0);
  }else{
    color1 = color;
    color2 = color;
    color3 = color;
    color4 = color;
  }
  //rotate the points around the center of the square
  let center = vec2((p1[0] + p2[0] + p3[0] + p4[0]) / 4, (p1[1] + p2[1] + p3[1] + p4[1]) / 4);
  
  p1 = rotate_point(center, rotation, p1);
  p2 = rotate_point(center, rotation, p2);
  p3 = rotate_point(center, rotation, p3);
  p4 = rotate_point(center, rotation, p4);

  add_triangle(position_array, color_array, p1, p2, p3, [color1, color2, color3]);
  add_triangle(position_array, color_array, p1, p3, p4, [color1, color3, color4]);
}

function add_circle(position_array, color_array, center, radius, color, segments){
  if (typeof(segments) == "undefined"){
    segments = 32;
  }
  for (let i = 0; i < segments; i++) {
    let angle1 = (i / segments) * 2 * Math.PI;
    let angle2 = ((i + 1) / segments) * 2 * Math.PI;
    let p1 = vec2(center[0] + radius * Math.cos(angle1), center[1] + radius * Math.sin(angle1));
    let p2 = vec2(center[0] + radius * Math.cos(angle2), center[1] + radius * Math.sin(angle2));
    add_triangle(position_array, color_array, center, p1, p2, [color, color, color]);
  }
}

function render(device, context, pipeline, positions, colors, timestamp){
  // Update animation state
  const seconds = timestamp / 1000;
  const positionIndex = seconds * 0.8;

  const encoder = device.createCommandEncoder();

  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
      clearValue: {
        r: 0.3921,
        g: 0.5843,
        b: 0.9294,
        a: 1.0
      }
    }]
  });

  positions.length = 0;
  colors.length = 0;

  let radius = 0.35;
  let position = positionIndex % (2.0 - radius * 2) - 1.0 + radius;

  position = 1.0 - 2.0 * Math.abs(position);
  position -= radius
  add_circle(positions, colors, vec2(0.0, position), radius, vec3(1.0, 1.0, 1.0));

  const positionBuffer = device.createBuffer({
    size: flatten(positions).byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const colorBuffer = device.createBuffer({
    size: flatten(colors).byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(positionBuffer, 0, flatten(positions));
  device.queue.writeBuffer(colorBuffer, 0, flatten(colors));

  pass.setPipeline(pipeline);
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
      positions,
      colors,
    )
  );
}

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
  const wgslfile = "p5.wgsl";
  const wgslcode = await fetch(wgslfile).then(r => r.text());
  const wgsl = device.createShaderModule({
    code: wgslcode
  });

  //buffer data types
  const positionBufferLayout = {
    arrayStride: sizeof['vec2'],
    attributes: [{
      format: 'float32x2',
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

  var positions = [];
  var colors = [];


  // device.queue.writeBuffer(positionBuffer, /*bufferOffset=*/0, flatten(positions));
  // device.queue.writeBuffer(colorBuffer, /*bufferOffset=*/0, flatten(colors));

  requestAnimationFrame(
    render.bind(
      null,
      device,
      context,
      pipeline,
      positions,
      colors,
    )
  );
}