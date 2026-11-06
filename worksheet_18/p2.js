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
  // Insert render pass commands here
  const wgslfile = "p2.wgsl";
  const wgslcode = await fetch(wgslfile).then(r => r.text());
  const wgsl = device.createShaderModule({
    code: wgslcode
  });

  //buffer data types
  // Binary records follow the worksheet layout, not the PLY header's property order.
  const splatBufferLayout = {
    arrayStride: sizeof['mat4'],
    stepMode: 'instance',
    attributes: [
      { format: 'float32x2', offset: 0, shaderLocation: 0 },
      { format: 'float32x2', offset: 8, shaderLocation: 1 },
      { format: 'float32x2', offset: 16, shaderLocation: 2 },
      { format: 'float32x2', offset: 24, shaderLocation: 3 },
      { format: 'float32x3', offset: 32, shaderLocation: 4 },
      { format: 'float32',   offset: 44, shaderLocation: 5 },
      { format: 'float32x3', offset: 48, shaderLocation: 6 },
    ],
  };
  
  //pipeline setup
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: wgsl,
    entryPoint: 'main_vs',
    buffers: [splatBufferLayout], },
    fragment: { module: wgsl,
    entryPoint: 'main_fs',
    targets: [{
        format: canvasFormat,
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        }
      }],
  },
    primitive: { topology: 'triangle-strip', },
  });

  const [splats] = await readPlyFile("lego-2d-sorted.ply");
  if (!splats || splats.stride !== splatBufferLayout.arrayStride ||
      splats.count === 0 || splats.data.byteLength !== splats.count * splats.stride) {
    throw new Error("Expected non-empty 64-byte splat records in lego-2d-sorted.ply");
  }
  const splatBuffer = device.createBuffer({
    size: splats.data.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(splatBuffer, 0, splats.data);
  const resolutionBuffer = device.createBuffer({
    size: sizeof['vec2'],
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(resolutionBuffer, 0, new Float32Array([canvas.width, canvas.height]));
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: resolutionBuffer } }],
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
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, splatBuffer);
  pass.draw(4, splats.count);

  pass.end();
  device.queue.submit([encoder.finish()])
  
}