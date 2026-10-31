"use strict";

var canvasColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
var uniformBuffer = undefined;
var textureSampler = undefined;
var textureView = undefined;
var texcoordBuffer = undefined;
var textureBindGroupLayout = undefined;
var bindGroup = undefined;

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

  obj.push(new any3D(
    device,
    pipeline,
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

  const eye = vec3(0.0, 0.0, 0.0);
  const lookat = vec3(0.0, -1.0, -8.0);
  const up = vec3(0.0, 1.0, 0.0);
  camera = new Camera(eye, lookat, up, new Projector(true, 90, 512/512, 0.1, 10.0));

  const cameraMvp = camera.Get();
  obj.forEach(object => {
    device.queue.writeBuffer(object.textureBindGroup.buffer.Get(), 0, cameraMvp);
  });
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
  main_cube();
};

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
    pass.setBindGroup(0, range.object.textureBindGroup.Get() || bindGroup);
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