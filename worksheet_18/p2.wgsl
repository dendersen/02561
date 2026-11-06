@group(0) @binding(0) var<uniform> resolution: vec2f;

struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) splatPosition: vec2f,
  @location(1) color: vec3f,
  @location(2) opacity: f32,
  @location(3) conic: vec3f,
};
@vertex fn main_vs(
  @location(0) inPos: vec2f,
  @location(1) halfSideLengths: vec2f,
  @location(2) direction1: vec2f,
  @location(3) direction2: vec2f,
  @location(4) inColor: vec3f,
  @location(5) opacity: f32,
  @location(6) conic: vec3f,
  @builtin(vertex_index) vertexIndex: u32,
) -> VSOut {
  let offsets = array<vec2f, 4>(
    vec2f(-1.0, -1.0),
    vec2f( 1.0, -1.0),  
    vec2f(-1.0,  1.0),
    vec2f( 1.0,  1.0),
  );
  let corner = offsets[vertexIndex] * halfSideLengths;
  let screenPosition = inPos + corner.x * direction1 + corner.y * direction2;
  // Screen coordinates have their origin at the top left, unlike NDC.
  let ndc = screenPosition / resolution * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
  var vsOut: VSOut;
  vsOut.position = vec4f(ndc, 0.0, 1.0);
  vsOut.splatPosition = inPos;
  vsOut.color = inColor;
  vsOut.opacity = opacity;
  vsOut.conic = conic;
  return vsOut;
}
@fragment fn main_fs(in: VSOut) -> @location(0) vec4f {
  let d = in.position.xy - in.splatPosition;
  let exponent = -0.5 * (
    in.conic.x * d.x * d.x +
    2.0 * in.conic.y * d.x * d.y +
    in.conic.z * d.y * d.y
  );
  let alpha = in.opacity * exp(exponent);
  return vec4f(in.color, alpha);
}