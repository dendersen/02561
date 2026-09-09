"use strict";
window.onload = function() { main(); }

function add_point(array, point, color_array, color)
{
  array.push(point);
  color_array.push(color);
}

function add_triangle(array, color_array, p1, p2, p3, color){
  let color1,color2,color3;
  console.log("color is: ", color, "is array: ", Array.isArray(color));
  if (Array.isArray(color) && color.length > 0){
    console.log("color is a array with length: ", color.length);
    color1 = color[0 % color.length];
    color2 = color[1 % color.length];
    color3 = color[2 % color.length];
  }
  else if ((Array.isArray(color) && color.length == 0) || typeof(color) == 'undefined'){
    console.log("color is a array with length == 0 or undefined");
    color1 = vec3(1.0, 0.0, 0.0);
    color2 = vec3(0.0, 1.0, 0.0);
    color3 = vec3(0.0, 0.0, 1.0);
  }else{
    console.log("color is a single color");
    color1 = color;
    color2 = color;
    color3 = color;
  }
  add_point(array, p1, color_array, color1);
  add_point(array, p2, color_array, color2);
  add_point(array, p3, color_array, color3);
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
  // Create a render pass in a command buffer and submit it
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: { r: 0.3921, g: 0.5843, b: 0.9294, a: 1.0 },
    }], 
  });
  // Insert render pass commands here
  const wgslfile = "p3.wgsl";
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
  add_triangle (positions,colors,
                 vec2(0.0, 0.5)      , vec2(-0.5,-0.5)    , vec2(0.5,-0.5),
                [vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)]);
  // add_point(positions, vec2( 0.0, 0.5), colors, vec3(1.0, 0.0, 0.0));
  // add_point(positions, vec2(-0.5,-0.5), colors, vec3(0.0, 1.0, 0.0));
  // add_point(positions, vec2( 0.5,-0.5), colors, vec3(0.0, 0.0, 1.0));
  const positionBuffer = device.createBuffer({
    size: flatten(positions).byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const colorBuffer = device.createBuffer({
    size: flatten(colors).byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(positionBuffer, /*bufferOffset=*/0, flatten(positions));
  device.queue.writeBuffer(colorBuffer, /*bufferOffset=*/0, flatten(colors));

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, positionBuffer);
  pass.setVertexBuffer(1, colorBuffer);
  pass.draw(positions.length);

  pass.end();
  device.queue.submit([encoder.finish()])
  
}