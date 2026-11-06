struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};
@vertex fn main_vs(
  @location(0) inPos: vec2f,
  @location(1) inColor: vec4f,
  @builtin(vertex_index) vertexIndex: u32,
) -> VSOut {
  let offsets = array<vec2f, 4>(
    vec2f(-0.25, -0.25),
    vec2f( 0.25, -0.25),
    vec2f(-0.25,  0.25),
    vec2f( 0.25,  0.25),
  );
  var vsOut: VSOut;
  vsOut.position = vec4f(inPos + offsets[vertexIndex], 0.0, 1.0);
  vsOut.color = inColor;
  return vsOut;
}
@fragment fn main_fs(@location(0) inColor: vec4f) -> @location(0) vec4f {
  return inColor;
}