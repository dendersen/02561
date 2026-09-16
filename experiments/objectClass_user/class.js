class polygon {
  constructor(vertices, color, name) {
    if (Array.isArray(vertices) && vertices.length >= 3) {
      this.vertices = vertices;
    } else {
      throw new Error("Invalid vertices array: ", vertices);
    }
    if (
      Array.isArray(color) && 
      color.every(c => !Array.isArray(c)) &&
      (
        color.length === 3 ||
        color.length === 4
      )
    ) {
      this.colors = [];
      for (let i = 0; i < vertices.length; i++) {
        this.colors.push(vec4(color, 1.0));
      }
    } else if (
      Array.isArray(color) && 
      color.length === vertices.length &&
      color.every(
        c => Array.isArray(c) &&
        (c.length === 3 || c.length === 4)
      )
    ) {
      this.colors = color.map(c => vec4(c, 1.0));
    }else {
      throw new Error("Invalid color array: ", color);
    }
    this.triangles = [];
    if (this.vertices.length > 3) {
      this.formatVertices();
    }
    this.name = name || "polygon 0x" + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, "0");
  }
  /**
   * this function is fully ai generated
   */
  formatVertices() {
    const remaining = this.vertices.map((vertex, index) => index);
    const area = this.vertices.reduce((sum, vertex, index) => {
      const next = this.vertices[(index + 1) % this.vertices.length];
      return sum + vertex[0] * next[1] - next[0] * vertex[1];
    }, 0) / 2;
    const orientation = Math.sign(area) || 1;
    const cross = (a, b, c) =>
      (b[0] - a[0]) * (c[1] - a[1]) -
      (b[1] - a[1]) * (c[0] - a[0]);
    const pointInTriangle = (point, a, b, c) => {
      const ab = cross(a, b, point) * orientation;
      const bc = cross(b, c, point) * orientation;
      const ca = cross(c, a, point) * orientation;
      return ab >= 0 && bc >= 0 && ca >= 0;
    };

    while (remaining.length > 3) {
      let earFound = false;

      for (let i = 0; i < remaining.length; i++) {
        const previous = remaining[(i - 1 + remaining.length) % remaining.length];
        const current = remaining[i];
        const next = remaining[(i + 1) % remaining.length];
        const a = this.vertices[previous];
        const b = this.vertices[current];
        const c = this.vertices[next];

        if (cross(a, b, c) * orientation <= 0) {
          continue;
        }

        const containsVertex = remaining.some(index =>
          index !== previous && index !== current && index !== next &&
          pointInTriangle(this.vertices[index], a, b, c)
        );
        if (containsVertex) {
          continue;
        }

        this.triangles.push(
          new polygon(
            [a, b, c],
            [this.colors[previous], this.colors[current], this.colors[next]]
          )
        );
        remaining.splice(i, 1);
        earFound = true;
        break;
      }

      if (!earFound) {
        throw new Error("Could not triangulate polygon. Check for self-intersections or duplicate vertices.");
      }
    }

    const [a, b, c] = remaining;
    this.triangles.push(
      new polygon(
        [this.vertices[a], this.vertices[b], this.vertices[c]],
        [this.colors[a], this.colors[b], this.colors[c]]
      )
    );
  }
  draw(position_array, color_array) {
    if (this.triangles.length > 0) {
      for (let i = 0; i < this.triangles.length; i++) {
        this.triangles[i].draw(position_array, color_array);
      }
    } else {
      for (let i = 0; i < this.vertices.length; i++) {
        position_array.push(this.vertices[i]);
        color_array.push(this.colors[i]);
      }
    }
  }
  getName() {
    return this.name;
  }
  getVertices() {
    return this.vertices;
  }
}

class polygonBuilder {
  constructor() {
    this.paused = false;
    this.demo = false;
    this.vertices = [];
    this.colors = [];
    this.polygonCount = 0;
  }
  replaceVertex(index, vertex, color) {
    if (this.paused) {
      console.log("Polygon builder is paused. Cannot replace vertex.");
      return;
    }
    if (index < 0 || index >= this.vertices.length) {
      throw new Error("Invalid index: ", index);
    }
    if (typeof(vertex) == "undefined") {
      vertex = [mouse_x, mouse_y];
    }
    if (typeof(color) == "undefined") {
      color = readColor("point-color");
    }
    if (Array.isArray(vertex) && vertex.length === 2) {
      this.vertices[index] = vec2(vertex);
    } else {
      throw new Error("Invalid vertex: ", vertex);
    }
    if (
      Array.isArray(color) &&
      !Array.isArray(color[0]) &&
      (color.length === 3 || color.length === 4)
    ) {
      this.colors[index] = vec4(color, 1.0);
    } else {
      throw new Error("Invalid color: ", color);
    }
  }
  empty() {
    return this.vertices.length === 0;
  }
  addVertex(vertex, color) {
    if (this.paused) {
      console.log("Polygon builder is paused. Cannot add vertex.");
      return;
    }
    if (typeof(vertex) == "undefined") {
      vertex = [mouse_x, mouse_y];
    }
    if (typeof(color) == "undefined") {
      color = readColor("point-color");
    }
    if (Array.isArray(vertex) && vertex.length === 2) {
      this.vertices.push(vec2(vertex));
    } else {
      throw new Error("Invalid vertex: ", vertex);
    }
    if (
      Array.isArray(color) &&
      !Array.isArray(color[0]) &&
      (color.length === 3 || color.length === 4)
    ) {
      this.colors.push(vec4(color, 1.0));
    } else {
      throw new Error("Invalid color: ", color);
    }
    document.getElementById("num-vertices").value = this.vertices.length
  }
  build() {
    let name = "ERROR";
    if (document.getElementById('polygon-name').value == "index") {
      name = String(this.polygonCount);
    }else{
      name = document.getElementById('polygon-name').value;
    }
    let out = new polygon(this.vertices, this.colors, name);
    this.clear();
    this.polygonCount++;
    document.getElementById("num-vertices").value = this.vertices.length
    document.getElementById('polygon-name').value = this.polygonCount;
    return out;
  }
  pause() {
    this.paused = !this.paused;
    if (this.paused) {
      console.log("Polygon builder paused.");
    } else {
      console.log("Polygon builder resumed.");
    }
  }
  draw(position_array, color_array) {
    let vertexToDraw = Array.from(this.vertices);
    let colorToDraw = Array.from(this.colors);

    if (this.demo) {
      vertexToDraw.push(vec2(mouse_x, mouse_y));
      colorToDraw.push(readColor("point-color"));
    }
    if (vertexToDraw.length > 2) {
      let tempPolygon = new polygon(vertexToDraw, colorToDraw);
      tempPolygon.draw(position_array, color_array);
    }else if (vertexToDraw.length == 2){
      add_line(position_array, color_array, ...vertexToDraw, 0.01, ...colorToDraw);
    }else if (vertexToDraw.length == 1){
      add_point(position_array, color_array, vertexToDraw[0], 0.025, colorToDraw[0]);
    }
  }
  clear() {
    this.vertices = [];
    this.colors = [];
    document.getElementById("num-vertices").value = this.vertices.length
    console.log("Polygon builder cleared.");
  }
  flipDemoMode() {
    this.demo = !this.demo;
  }
  getName() {
    return "polygonBuilder";
  }
}

var builder = new polygonBuilder();