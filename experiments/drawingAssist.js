
function add_vector(position_array, point, color_array, color)
{
  position_array.push(point);
  color_array.push(vec4(color, 1.0));
}

function add_point(position_array, color_array, point, size, color)
{
  const offset = size/2;
  var point_coords = [ vec2(point[0] - offset, point[1] - offset), vec2(point[0] + offset, point[1] - offset),
  vec2(point[0] - offset, point[1] + offset), vec2(point[0] - offset, point[1] + offset),
  vec2(point[0] + offset, point[1] - offset), vec2(point[0] + offset, point[1] + offset) ];
  position_array.push(...point_coords);
  color_array.push(color, color, color, color, color, color);
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
  add_vector(position_array, p1, color_array, color1);
  add_vector(position_array, p2, color_array, color2);
  add_vector(position_array, p3, color_array, color3);
}

let rotate_point = function(center, rotation, p){
  let x = p[0] - center[0];
  let y = p[1] - center[1];
  let x_new = x * Math.cos(rotation) - y * Math.sin(rotation);
  let y_new = x * Math.sin(rotation) + y * Math.cos(rotation);
  return vec2(x_new + center[0], y_new + center[1]);
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

function add_circle(position_array, color_array, center, radius, color, color2, segments){
  if (typeof(color2) == "undefined"){
    color2 = color;
  }
  if (typeof(segments) == "undefined"){
    segments = 32;
  }
  for (let i = 0; i < segments; i++) {
    let angle1 = (i / segments) * 2 * Math.PI;
    let angle2 = ((i + 1) / segments) * 2 * Math.PI;
    let p1 = vec2(center[0] + radius * Math.cos(angle1), center[1] + radius * Math.sin(angle1));
    let p2 = vec2(center[0] + radius * Math.cos(angle2), center[1] + radius * Math.sin(angle2));
    add_triangle(position_array, color_array, center, p1, p2, [color, color2, color2]);
  }
}

function add_line(position_array, color_array, p1, p2, width, color, color2){
  if (typeof(color2) == "undefined"){
    color2 = color;
  }
  let offset = width / 2;
  let dx = p2[0] - p1[0];
  let dy = p2[1] - p1[1];
  let length = Math.sqrt(dx * dx + dy * dy);
  let ux = dx / length;
  let uy = dy / length;
  let px = -uy * offset;
  let py = ux * offset;

  let p1_left = vec2(p1[0] + px, p1[1] + py);
  let p1_right = vec2(p1[0] - px, p1[1] - py);
  let p2_left = vec2(p2[0] + px, p2[1] + py);
  let p2_right = vec2(p2[0] - px, p2[1] - py);

  add_triangle(position_array, color_array, p1_left, p1_right, p2_left, [color, color, color2]);
  add_triangle(position_array, color_array, p1_right, p2_right, p2_left, [color, color2, color2]);
}