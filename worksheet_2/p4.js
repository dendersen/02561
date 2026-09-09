"use strict";
window.onload = function() { main(); }

var mouse_x = 0;
var mouse_y = 0;

function onMouseMove(event){
  let rec = event.target.getBoundingClientRect();
  mouse_x = (event.clientX - rec.left) / rec.width * 2 - 1;
  mouse_y = (rec.bottom - event.clientY) / rec.height * 2 - 1;
}

function click_point(x, y, color){
  add_point(VertexArray, VertexColorArray, vec2(x, y), 0.1, color);
}

function click_triangle_callBack(position_array, color_array){
  if (tempArray.length == 0){
    clickCallBack = null;
    return;
  }
  let x = mouse_x;
  let y = mouse_y;
  let color = readColor("point-color",false);
  if (tempArray.length == 1){
    add_line(position_array, color_array, tempArray[0], vec2(x, y), 0.01, tempColorArray[0], color);
  }
  if (tempArray.length == 2){
    add_triangle(position_array, color_array, tempArray[0], tempArray[1], vec2(x, y), [tempColorArray[0], tempColorArray[1], color]);
  }
  if (tempArray.length == 3){
    add_triangle(position_array, color_array, tempArray[0], tempArray[1], tempArray[2], tempColorArray);
  }
}

function click_triangle(x, y, color){
  if (tempArray.length == 0){
    tempArray.push(vec2(x, y));
    tempColorArray.push(color);
    clickCallBack = click_triangle_callBack;
  }
  else if (tempArray.length == 1){
    tempArray.push(vec2(x, y));
    tempColorArray.push(color);
    clickCallBack = click_triangle_callBack;
  }
  else if (tempArray.length == 2){
    tempArray.push(vec2(x, y));
    tempColorArray.push(color);
    add_triangle(VertexArray, VertexColorArray, tempArray[0], tempArray[1], tempArray[2], tempColorArray);
    tempArray.length = 0;
    tempColorArray.length = 0;
    clickCallBack = null;
    tempArray.length = 0;
  }
}

function click_circle_callBack(position_array, color_array){
  if (tempArray.length == 0){
    clickCallBack = null;
    return;
  }
  let x = mouse_x;
  let y = mouse_y;
  let color = readColor("point-color",false);
  if (tempArray.length == 1){
    let center = tempArray[0];
    let radius = Math.sqrt(Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2));
    add_circle(position_array, color_array, center, radius, tempColorArray[0], color);
  }
}

function click_circle(x, y, color){
  if (tempArray.length == 0){
    tempArray.push(vec2(x, y));
    tempColorArray.push(color);
    clickCallBack = click_circle_callBack;
  }
  else if (tempArray.length == 1){
    tempArray.push(vec2(x, y));
    tempColorArray.push(color);
    let center = tempArray[0];
    let radius = Math.sqrt(Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2));
    add_circle(VertexArray, VertexColorArray, center, radius, tempColorArray[0], color);
    tempArray.length = 0;
    tempColorArray.length = 0;
    clickCallBack = null;
    tempArray.length = 0;
  }
}

function updateClickEffect(){
  let clickEffect = document.getElementById("click-effect").value;
  if (clickEffect == "points"){
    clickTarget = click_point;
  }else if (clickEffect == "triangles"){
    clickTarget = click_triangle;
  }else if (clickEffect == "circles"){
    clickTarget = click_circle;
  }
}

var clickTarget = click_point;

function onClick(event){
  let rec = event.target.getBoundingClientRect();
  let x = (event.clientX - rec.left) / rec.width * 2 - 1;
  let y = (rec.bottom - event.clientY) / rec.height * 2 - 1;
  let col = readColor("point-color",false)
  clickTarget(x, y, col);
}

function readColor(targetID, giveVec4 = false){
  let colorElement = document.getElementById(targetID).value;
  if (giveVec4){
    return vec4(
      parseInt(colorElement.substring(1, 3), 16) / 255,
      parseInt(colorElement.substring(3, 5), 16) / 255,
      parseInt(colorElement.substring(5, 7), 16) / 255,
      1.0
    );
  }else{
    return vec3(
      parseInt(colorElement.substring(1, 3), 16) / 255,
      parseInt(colorElement.substring(3, 5), 16) / 255,
      parseInt(colorElement.substring(5, 7), 16) / 255
    );
  }
}

var canvasColor = vec4(0.3921, 0.5843, 0.9294, 1.0);

function clearCanvas(){
  VertexArray.length = 0;
  VertexColorArray.length = 0;
  canvasColor = readColor("canvas-color", true);
}

//should not be modified only cleared
var VertexArray = [];
var VertexColorArray = [];

//fully used by the click callbacks
var clickCallBack = null;
var tempArray = [];
var tempColorArray = [];

function render(device, context, pipeline, timestamp){
  const encoder = device.createCommandEncoder();
  
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
      clearValue: canvasColor
    }]
  });

  let positions = [];
  let colors = [];
  if (typeof(VertexArray) == 'undefined' || typeof(VertexColorArray) == 'undefined'){
    console.error("VertexArray or VertexColorArray is not defined");
    return;
  }
  if (VertexArray.length > 0 && VertexColorArray.length > 0){
    positions.push(...VertexArray);
    colors.push(...VertexColorArray);
  }

  if (clickCallBack != null){
    clickCallBack(positions, colors);
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
      )
    );
    return;
  }

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
    )
  );
  document.getElementById("canvas-color").value = "#" + ((1 << 24) + (Math.floor(canvasColor[0] * 255) << 16) + (Math.floor(canvasColor[1] * 255) << 8) + Math.floor(canvasColor[2] * 255)).toString(16).slice(1);
}

