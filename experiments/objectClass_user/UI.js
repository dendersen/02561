var mouse_x = 0;
var mouse_y = 0;
var canvasColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
function onMouseMove(event){
  let rec = event.target.getBoundingClientRect();
  mouse_x = (event.clientX - rec.left) / rec.width * 2 - 1;
  mouse_y = (rec.bottom - event.clientY) / rec.height * 2 - 1;
}

function readColor(targetID){
  let colorElement = document.getElementById(targetID).value;
  return vec4(
    parseInt(colorElement.substring(1, 3), 16) / 255,
    parseInt(colorElement.substring(3, 5), 16) / 255,
    parseInt(colorElement.substring(5, 7), 16) / 255,
    1.0
  );
}

function clearCanvas(){
  builder.clear();
  polygonArray = [builder];
  setCanvesColor();
}

function setCanvesColor(){
  canvasColor = readColor("canvas-color", true);
}

function setSelector(){
  console.log("updating selector with polygonArray: ", polygonArray.slice(1));
  let selector = document.getElementById("polygon-selector");
  selector.innerHTML = "";
  for (let i = 1; i < polygonArray.length; i++){
    let option = document.createElement("option");
    option.value = i;
    option.text = polygonArray[i].name;
    selector.appendChild(option);
  }
  setPolygon_vertex_selector()
}

function removePolygon(){
  let selector = document.getElementById("polygon-selector");
  let index = selector.value;
  if (index >= 1 && index < polygonArray.length){
    polygonArray.splice(index, 1);
  }else{
    console.log("Invalid polygon index selected: ", index);
  }
  setSelector();
}

function selectPolygon(){
  let selector = document.getElementById("polygon-selector");
  let index = selector.value;
  if (index >= 1 && index < polygonArray.length){
    builder.vertices = polygonArray[index].vertices.slice();
    builder.colors = polygonArray[index].colors.slice();
    document.getElementById("num-vertices").value = builder.vertices.length;
    document.getElementById("polygon-name").value = polygonArray[index].name;
  }else{
    console.log("Invalid polygon index selected: ", index);
  }
  setPolygon_vertex_selector()
}

function setPolygon_vertex_selector(){
  console.log("selectPolygon_vertex called");
  let selector = document.getElementById("polygon-selector");
  let index = selector.value;
  let selector_vertex = document.getElementById("polygon-vertex-selector");
  selector_vertex.innerHTML = "";
  if (polygonArray.length <= 1){
    return
  }
  console.log("polygonArray: ", polygonArray[index]);
  for (let i = 0; i < polygonArray[index].getVertices().length; i++){
    let option = document.createElement("option");
    option.value = i;
    option.text = i;
    selector_vertex.appendChild(option);
  }
}

var drawSel = false;
function drawSelected(position_array, color_array) {
  if (!drawSel) return;
  try {
    let selector = document.getElementById("polygon-selector");
    let index = selector.value;
    let selector_vertex = document.getElementById("polygon-vertex-selector");
    let vertex_index = selector_vertex.value;
    vertex = polygonArray[index].getVertices()[vertex_index];
    if (vertex) {
      add_point(position_array, color_array, vertex, 0.025, vec4(0.0, 1.0, 0.0, 1.0));
    }
  } catch (error) {
  }
}

function deleteSelectedVertex() {
  try {
    let selector = document.getElementById("polygon-selector");
    let index = selector.value;
    let selector_vertex = document.getElementById("polygon-vertex-selector");
    let vertex_index = selector_vertex.value;
    if (polygonArray[index].getVertices().length <= 3) {
      console.log("Cannot delete vertex. Polygon must have at least 3 vertices.");
      let oldName = document.getElementById("delete-vertex").value;
      document.getElementById("delete-vertex").value = "Cannot delete vertex from triangle\ndelete whole polygon instead";
      setTimeout(() => {
        document.getElementById("delete-vertex").value = oldName;
      }, 2000);
      return;
    }
    if (index >= 1 && index < polygonArray.length) {
      polygonArray[index].vertices.splice(vertex_index, 1);
      polygonArray[index].colors.splice(vertex_index, 1);
      setPolygon_vertex_selector();
      document.getElementById("num-vertices").value = polygonArray[index].vertices.length;
    } else {
      console.log("Invalid polygon index selected: ", index);
    }
  }
  catch (error) {
    console.log("Error deleting selected vertex: ", error);
  }
}

function loadPolygonToBuilder() {
  let selector = document.getElementById("polygon-selector");
  let index = selector.value;
  let selector_vertex = document.getElementById("polygon-vertex-selector");
  let vertex_index = selector_vertex.value;
  builder.clear();
  for (let i = 0; i < polygonArray[index].getVertices().length; i++) {
    builder.addVertex(polygonArray[index].getVertices()[(i + vertex_index) % polygonArray[index].colors.length], polygonArray[index].colors[(i + vertex_index) % polygonArray[index].colors.length]);
  }
  removePolygon();
}

function replaceSelectedVertex() {
  if (!builder.empty()) {
    let oldName = document.getElementById("replace-vertex").value;
    document.getElementById("replace-vertex").value = "builder not empty, clear builder first";
    setTimeout(() => {
      document.getElementById("replace-vertex").value = oldName;
    }, 2000);
  }
  loadPolygonToBuilder();
  document.getElementById("my-canvas").onmousemove = "builder.replaceVertex(0);polygonArray.push(builder.build());setSelector();document.getElementById(\"my-canvas\").onmousemove = addVertex();"
}