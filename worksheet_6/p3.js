"use strict";

var canvasColor = vec4(0, 0, 0, 1);
var sphere;
var camera;
var uniformBuffer;
var positionBuffer;
var colorBuffer;
var texcoordBuffer;
var depthTexture;
var vertexCount = 0;
var resetBuff = true;
var oldTime = 0;

async function main() {
  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported in this browser.");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No WebGPU adapter is available.");
  }
  const device = await adapter.requestDevice();
  const canvas = document.getElementById("triple-canvas");
  const context = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: canvasFormat });

  const shaderResponse = await fetch("p3.wgsl");
  if (!shaderResponse.ok) {
    throw new Error(`Failed to load p3.wgsl: ${shaderResponse.status}`);
  }
  const shader = device.createShaderModule({ code: await shaderResponse.text() });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "main_vs",
      buffers: [
        {
          arrayStride: sizeof["vec4"],
          attributes: [{ format: "float32x3", offset: 0, shaderLocation: 0 }],
        },
        {
          arrayStride: sizeof["vec4"],
          attributes: [{ format: "float32x4", offset: 0, shaderLocation: 1 }],
        },
        {
          arrayStride: sizeof["vec2"],
          attributes: [{ format: "float32x2", offset: 0, shaderLocation: 2 }],
        },
      ],
    },
    fragment: {
      module: shader,
      entryPoint: "main_fs",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
      frontFace: "ccw",
    },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });

  const colors = [vec3(1, 1, 1)];
  const subdivisionLevel = new Number(
    0,
    false,
    "Subdivision level"
  );
  sphere = new sphere3D(
    device,
    pipeline,
    vec3(0, 0, 0),
    1,
    colors,
    "earth.jpg",
    [],
    subdivisionLevel,
    8
  );
  uniformBuffer = sphere.textureBindGroup.buffer.Get();

  const cameraEye = new timeDependentSource(seconds => {
    const angle = radians(seconds * 30);
    return vec3(3 * Math.sin(angle), 0, -3 * Math.cos(angle));
  }, false, true);
  const cameraDirection = new timeDependentSource(seconds => {
    const angle = radians(seconds * 30);
    return vec3(-3 * Math.sin(angle), 0, 3 * Math.cos(angle));
  }, false, true);
  camera = new Camera(
    cameraEye,
    cameraDirection,
    vec3(0, 1, 0),
    new Projector(true, 45, canvas.width / canvas.height, 0.1, 10)
  );

  requestAnimationFrame(timestamp =>
    render(device, context, pipeline, timestamp)
  );
}

function render(device, context, pipeline, timestamp) {
  if (sphere.draw()) {
    resetBuff = true;
  }

  const seconds = timestamp / 1000;
  const frameRate = oldTime === 0 ? 0 : 1 / (seconds - oldTime);
  document.getElementById("frameRate").textContent =
    frameRate < 5
      ? (Math.floor(frameRate * 10) / 10).toString()
      : Math.floor(frameRate).toString();
  oldTime = seconds;

  device.queue.writeBuffer(uniformBuffer, 0, camera.Get());
  device.queue.writeBuffer(
    uniformBuffer,
    sizeof["mat4"],
    new Float32Array(vec4(0, 0, -1, 0))
  );
  device.queue.writeBuffer(
    uniformBuffer,
    sizeof["mat4"] + sizeof["vec4"],
    new Float32Array([1, 1, 1, 0])
  );
  device.queue.writeBuffer(
    uniformBuffer,
    sizeof["mat4"] + 2 * sizeof["vec4"],
    new Float32Array([0.3, 0.3, 0.3, 0])
  );

  const encoder = device.createCommandEncoder();
  if (
    depthTexture === undefined ||
    depthTexture.width !== context.canvas.width ||
    depthTexture.height !== context.canvas.height
  ) {
    depthTexture = device.createTexture({
      size: [context.canvas.width, context.canvas.height, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
      clearValue: canvasColor,
    }],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });

  if (resetBuff) {
    const positions = [];
    const colors = [];
    const texcoords = [];
    sphere.draw(positions, colors, texcoords);
    const flatPositions = flatten(positions);
    const flatColors = flatten(colors);
    const flatTexcoords = flatten(texcoords);

    for (const buffer of [positionBuffer, colorBuffer, texcoordBuffer]) {
      if (buffer) {
        buffer.destroy();
      }
    }
    positionBuffer = device.createBuffer({
      size: flatPositions.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    colorBuffer = device.createBuffer({
      size: flatColors.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    texcoordBuffer = device.createBuffer({
      size: flatTexcoords.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(positionBuffer, 0, flatPositions);
    device.queue.writeBuffer(colorBuffer, 0, flatColors);
    device.queue.writeBuffer(texcoordBuffer, 0, flatTexcoords);
    vertexCount = positions.length;
    document.getElementById("faces").textContent = sphere.faces.length;
    resetBuff = false;
  }

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, sphere.textureBindGroup.Get());
  pass.setVertexBuffer(0, positionBuffer);
  pass.setVertexBuffer(1, colorBuffer);
  pass.setVertexBuffer(2, texcoordBuffer);
  pass.draw(vertexCount);
  pass.end();
  device.queue.submit([encoder.finish()]);

  requestAnimationFrame(nextTimestamp =>
    render(device, context, pipeline, nextTimestamp)
  );
}

window.onload = main;
