var DefaultTextureGroup = undefined;

function createUniformBuffer(device){
  let uniformBuffer = device.createBuffer({
    size: sizeof['mat4'] + sizeof['vec4'] * 7,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  return uniformBuffer;
}

function getDefaultTextureGroup(device, pipeline){
  if (typeof(DefaultTextureGroup) == 'undefined') {

    const textureSampler = device.createSampler({
      addressModeU: "repeat",
      addressModeV: "repeat",
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear",
      maxAnisotropy: 1,
    });
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
    const textureView = createSolidTexture(device, [255, 255, 255, 255]).createView();
    const textureBindGroupLayout = pipeline.getBindGroupLayout(0);
    DefaultTextureGroup = device.createBindGroup({
      layout: textureBindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: createUniformBuffer(device) }
      }, {
        binding: 1,
        resource: textureSampler,
      }, {
        binding: 2,
        resource: textureView,
      }],
    });
  }
  return DefaultTextureGroup;
}

function defineColors(colors, desiredCount){
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
  if (typeof(colors) == 'undefined') {
    colors = [];
  }
  if (Array.isArray(colors) && colors.length > 0 && !Array.isArray(colors[0])) {
    let color = colors;
    colors = [];
    for(let i = 0; i < desiredCount; i++) {
      colors.push(vec4(...color, 1.0));
    }
    return colors;
  }
  if (Array.isArray(colors) && Array.isArray(colors[0])) {
    template = colors;
    colors = [];
  }
  if (Array.isArray(colors) && colors.length == 0) {
    while(colors.length < desiredCount) {
      colors.push(vec4(...template[colors.length % template.length], 1.0));
    }
    return colors;
  }
  throw new Error("Unable to define colors with the given input.");
}

function add_vector(position_array, point, color_array, color)
{
  point = vec4(point, 1.0);
  position_array.push(point);
  color_array.push(color);
}

function drawTriangle3D(position_array, color_array, p1, p2, p3, color){
  let colors = defineColors(color, 3);
  add_vector(position_array, p1, color_array, colors[0]);
  add_vector(position_array, p2, color_array, colors[1]);
  add_vector(position_array, p3, color_array, colors[2]);
}

function pointDistance(p1,p2){
  return Math.sqrt(
    Math.pow(p1[0] - p2[0], 2) +
    Math.pow(p1[1] - p2[1], 2) +
    Math.pow(p1[2] - p2[2], 2)
  );
}

class any3D{
  constructor(device, pipeline, vertexes, colors, faces, texturePath = undefined, texcoords = []){
    this.device = device;
    this.vertexes = vertexes;
    this.texturePath = texturePath;
    this.texcoords = texcoords.length > 0
      ? texcoords
      : vertexes.map(vertex => vec2((vertex[0] + 4.0) / 8.0, (-vertex[2] - 1.0) / 20.0));
    this.textureBindGroup = undefined;
    this.colors = defineColors(colors, vertexes.length);
    this.faces = faces;
    if (this.texturePath) {
      this.textureBindGroup = createTextureBindGroup(device, this.texturePath, pipeline);
    } else {
      this.textureBindGroup = getDefaultTextureGroup(device, pipeline);
    }
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
  cleanupVertexes(){
    let uniqueVertexes = [];
    let colors = []
    console.log("vertex count before cleanup: " + this.vertexes.length);
    for (let i = 0; i < this.vertexes.length; i++) {
      if (!uniqueVertexes.some(v => pointDistance(v, this.vertexes[i]) < 1e-6)) {
        uniqueVertexes.push(this.vertexes[i]);
        colors.push(this.colors[i]);
        for (let j = 0; j < this.faces.length; j++) {
          for (let k = 0; k < 3; k++) {
            if (this.faces[j][k] === i) {
              this.faces[j][k] = uniqueVertexes.length - 1;
            }
          }
        }
      }
    }
    console.log("vertex count after cleanup: " + uniqueVertexes.length);
    this.vertexes = uniqueVertexes;
    this.colors = colors;
  }
}

class sphere3D extends any3D {
  constructor(device, pipeline, center, radius, colors, texturePath = undefined, texcoords = [], initialSubdivides = 0) {
    super();
    this.center = center;
    this.radius = radius;
    
    this.colors = defineColors(colors, 4);

    let p1 = vec3(0.0, 0.0, 1.0)
    let p2 = vec3(0.0, (2*Math.sqrt(2.0)/3), -1.0/3)
    let p3 = vec3(-Math.sqrt(6.0)/3, -Math.sqrt(2.0)/3, -1.0/3)
    let p4 = vec3(Math.sqrt(6.0)/3, -Math.sqrt(2.0)/3, -1.0/3)

    this.vertexes = [p1, p2, p3, p4];

    this.faces = []
    this.faces.push([0, 1, 2]);
    this.faces.push([0, 2, 3]);
    this.faces.push([0, 3, 1]);
    this.faces.push([1, 3, 2]);
    this.divisions = 0;
    this.pushOnCircle();
    this.subdivide(initialSubdivides)
  }
  pushOnCircle() {
    for (let i = 0; i < this.vertexes.length; i++) {
      let p = this.vertexes[i];
      let dir = subtract(p, this.center);
      let len = Math.sqrt(dot(dir, dir));
      if (len == 0) {
        this.vertexes[i] = add(this.center, vec3(this.radius, 0, 0));
      } else {
        this.vertexes[i] = add(this.center, scale(this.radius / len, dir));
      }
    }
  }
  subdivideSingle(){
    let newVertexes = [];
    let newColors = [];
    let newFaces = [];
    for (let i = 0; i < this.faces.length; i++) {
      let p1 = this.vertexes[this.faces[i][0]];
      let p2 = this.vertexes[this.faces[i][1]];
      let p3 = this.vertexes[this.faces[i][2]];
      let p1_2 = vec3(
        (p1[0] + p2[0]) / 2,
        (p1[1] + p2[1]) / 2,
        (p1[2] + p2[2]) / 2
      );
      let p2_3 = vec3(
        (p2[0] + p3[0]) / 2,
        (p2[1] + p3[1]) / 2,
        (p2[2] + p3[2]) / 2
      );
      let p3_1 = vec3(
        (p3[0] + p1[0]) / 2,
        (p3[1] + p1[1]) / 2,
        (p3[2] + p1[2]) / 2
      );
      let c1 = this.colors[this.faces[i][0]];
      let c2 = this.colors[this.faces[i][1]];
      let c3 = this.colors[this.faces[i][2]];
      let c1_2 = vec3(
        (c1[0] + c2[0]) / 2,
        (c1[1] + c2[1]) / 2,
        (c1[2] + c2[2]) / 2
      );
      let c2_3 = vec3(
        (c2[0] + c3[0]) / 2,
        (c2[1] + c3[1]) / 2,
        (c2[2] + c3[2]) / 2
      );
      let c3_1 = vec3(
        (c3[0] + c1[0]) / 2,
        (c3[1] + c1[1]) / 2,
        (c3[2] + c1[2]) / 2
      );
      startIndex = newVertexes.length;
      newVertexes.push(p1); newColors.push(c1);
      newVertexes.push(p2); newColors.push(c2);
      newVertexes.push(p3); newColors.push(c3);
      newVertexes.push(p1_2); newColors.push(c1_2);
      newVertexes.push(p2_3); newColors.push(c2_3);
      newVertexes.push(p3_1); newColors.push(c3_1);

      p1_i = startIndex;
      p2_i = startIndex + 1;
      p3_i = startIndex + 2;
      p1_2_i = startIndex + 3;
      p2_3_i = startIndex + 4;
      p3_1_i = startIndex + 5;

      newFaces.push([p1_i, p1_2_i, p3_1_i]);
      newFaces.push([p1_2_i, p2_3_i, p3_1_i]);
      newFaces.push([p2_3_i, p3_i, p3_1_i]);
      newFaces.push([p1_2_i, p2_3_i, p3_1_i]);
    }
    this.cleanupVertexes()
    this.vertexes = newVertexes;
    this.colors = newColors;
    this.faces = newFaces;
  }
  subdivide(target) {
    if (this.divisions > target) {
      let temp = new sphere3D(this.device, this.pipeline, this.center, this.radius, this.colors, this.texturePath, this.texcoords, target);
      this.faces = temp.faces;
      this.vertexes = temp.vertexes;
    }
    while(this.divisions < target) {
      this.subdivideSingle();
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
}
class obj3D extends any3D{
  constructor(information, isPathToObj = false) {
    super();
    if (isPathToObj) {
      readOBJFile(information).then((objFile) => {
        information = objFile;
      });
    }
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
}