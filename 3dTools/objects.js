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
    sampler = new TextureSampler(device, "repeat", "repeat", "linear", "linear", "linear", 1);
    const texture = device.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture: texture },
      new Uint8Array([255, 255, 255, 255]),
      { bytesPerRow: 4 },
      [1, 1, 1]
    );
    const textureView = texture.createView();
    DefaultTextureGroup = new TextureBindGroup(device, pipeline, createUniformBuffer(device), sampler, textureView);
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
  constructor(device, pipeline, vertexes, colors, faces, texturePath = undefined, textureBindGroup = undefined, texcoords = []){
    this.device = device;
    this.vertexes = vertexes;
    this.texturePath = texturePath;
    this.texcoords = texcoords.length > 0
      ? texcoords
      : vertexes.map(vertex => vec2((vertex[0] + 4.0) / 8.0, (-vertex[2] - 1.0) / 20.0));
    this.textureBindGroup = textureBindGroup;
    this.colors = defineColors(colors, vertexes.length);
    this.faces = faces;
    if (this.texturePath && !this.textureBindGroup) {
      let buffer = createUniformBuffer(device);
      let sampler = new TextureSampler(device, "repeat", "repeat", "linear", "linear", "linear", 1);
      let view = new TextureView(device, new Texture(device, this.texturePath, false))
      this.textureBindGroup = new TextureBindGroup(device, pipeline, buffer, sampler, view);
    } else if (!this.textureBindGroup) {
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
  constructor(device, pipeline, center, radius, colors, texturePath = undefined, texcoords = [], initialSubdivides = 0, maxAnisotropy = 1) {
    const subdivisionSource = makeSource(initialSubdivides);
    const subdivisionLevel = subdivisionSource.Get();
    const geometry = sphere3D.createGeometry(
      center,
      radius,
      colors,
      subdivisionLevel,
      texcoords
    );
    super(
      device,
      pipeline,
      geometry.vertices,
      geometry.colors,
      geometry.faces,
      texturePath,
      undefined,
      geometry.texcoords
    );
    if (texturePath) {
      this.textureBindGroup.textureSampler = new TextureSampler(
        device, "repeat", "clamp-to-edge", "linear", "linear", "linear", maxAnisotropy
      );
    }
    this.center = center;
    this.radius = radius;
    this.baseColors = geometry.baseColors;
    this.baseTexcoords = texcoords;
    this.subdivisionSource = subdivisionSource;
    this.divisions = subdivisionLevel;
  }
  static createGeometry(center, radius, colors, subdivisions, texcoords) {
    if (
      typeof subdivisions !== "number" ||
      !isFinite(subdivisions) ||
      Math.floor(subdivisions) !== subdivisions ||
      subdivisions < 0
    ) {
      throw new RangeError("Subdivision level must be a non-negative integer.");
    }

    const baseColors = defineColors(colors, 4).map(color =>
      vec3(color[0], color[1], color[2])
    );
    const projectToSphere = point => {
      const direction = subtract(point, center);
      const length = Math.sqrt(dot(direction, direction));
      return length === 0
        ? add(center, vec3(radius, 0, 0))
        : add(center, scale(radius / length, direction));
    };
    const midpoint = (a, b) => vec3(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2
    );
    const midpointColor = (a, b) => vec3(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2
    );
    const midpointTexcoord = (a, b) => vec2(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2
    );
    const initialVertices = [
      vec3(0, 0, 1),
      vec3(0, 2 * Math.sqrt(2) / 3, -1 / 3),
      vec3(-Math.sqrt(6) / 3, -Math.sqrt(2) / 3, -1 / 3),
      vec3(Math.sqrt(6) / 3, -Math.sqrt(2) / 3, -1 / 3),
    ].map(projectToSphere);
    const initialTexcoords = texcoords.length === 4
      ? texcoords
      : initialVertices.map(vertex =>
        vec2((vertex[0] + 4) / 8, (-vertex[2] - 1) / 20)
      );
    let triangles = [
      [[0, 1, 2], [0, 1, 2]],
      [[0, 2, 3], [0, 2, 3]],
      [[0, 3, 1], [0, 3, 1]],
      [[1, 3, 2], [1, 3, 2]],
    ].map(([indices, colorIndices]) => ({
      vertices: indices.map(index => initialVertices[index]),
      colors: colorIndices.map(index => baseColors[index]),
      texcoords: indices.map(index => initialTexcoords[index]),
    }));

    for (let level = 0; level < subdivisions; level++) {
      const nextTriangles = [];
      for (const triangle of triangles) {
        const [a, b, c] = triangle.vertices;
        const [colorA, colorB, colorC] = triangle.colors;
        const [uvA, uvB, uvC] = triangle.texcoords;
        const ab = projectToSphere(midpoint(a, b));
        const bc = projectToSphere(midpoint(b, c));
        const ca = projectToSphere(midpoint(c, a));
        const colorAB = midpointColor(colorA, colorB);
        const colorBC = midpointColor(colorB, colorC);
        const colorCA = midpointColor(colorC, colorA);
        const uvAB = midpointTexcoord(uvA, uvB);
        const uvBC = midpointTexcoord(uvB, uvC);
        const uvCA = midpointTexcoord(uvC, uvA);
        nextTriangles.push(
          { vertices: [a, ab, ca], colors: [colorA, colorAB, colorCA], texcoords: [uvA, uvAB, uvCA] },
          { vertices: [ab, b, bc], colors: [colorAB, colorB, colorBC], texcoords: [uvAB, uvB, uvBC] },
          { vertices: [ca, bc, c], colors: [colorCA, colorBC, colorC], texcoords: [uvCA, uvBC, uvC] },
          { vertices: [ab, bc, ca], colors: [colorAB, colorBC, colorCA], texcoords: [uvAB, uvBC, uvCA] }
        );
      }
      triangles = nextTriangles;
    }

    const vertices = [];
    const vertexColors = [];
    const vertexTexcoords = [];
    const faces = [];
    for (const triangle of triangles) {
      const firstVertex = vertices.length;
      vertices.push(...triangle.vertices);
      vertexColors.push(...triangle.colors);
      vertexTexcoords.push(...triangle.texcoords);
      faces.push([firstVertex, firstVertex + 1, firstVertex + 2]);
    }
    return {
      vertices,
      colors: vertexColors,
      faces,
      texcoords: vertexTexcoords,
      baseColors,
    };
  }
  subdivide(target) {
    if (
      typeof target !== "number" ||
      !isFinite(target) ||
      Math.floor(target) !== target ||
      target < 0
    ) {
      throw new RangeError("Subdivision level must be a non-negative integer.");
    }
    if (this.divisions === target) {
      return;
    }
    const geometry = sphere3D.createGeometry(
      this.center,
      this.radius,
      this.baseColors,
      target,
      this.baseTexcoords
    );
    this.vertexes = geometry.vertices;
    this.colors = defineColors(geometry.colors, geometry.vertices.length);
    this.faces = geometry.faces;
    this.texcoords = geometry.texcoords;
    this.divisions = target;
  }
  draw(position_array = undefined, color_array = undefined, texcoord_array = undefined) {
    let updated = false;
    if (this.subdivisionSource.hasUpdate()) {
      const target = this.subdivisionSource.Get();
      if (target !== this.divisions) {
        this.subdivide(target);
        updated = true;
      }
    }
    if (
      typeof(position_array) !== "undefined" ||
      typeof(color_array) !== "undefined" ||
      typeof(texcoord_array) !== "undefined"
    ) {
      if (
        typeof(position_array) === "undefined" ||
        typeof(color_array) === "undefined" ||
        typeof(texcoord_array) === "undefined"
      ) {
        throw new Error("Sphere drawing requires position, color, and texture-coordinate arrays.");
      }
      super.draw(position_array, color_array, texcoord_array);
    }
    return updated;
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