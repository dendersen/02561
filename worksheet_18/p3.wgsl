@group(0) @binding(0) var<uniform> resolution: vec2f;

struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) splatPosition: vec2f,
  @location(1) color: vec3f,
  @location(2) opacity: f32,
  @location(3) conic: vec3f,
  @location(4) @interpolate(flat) instanceIndex: u32,
};
@vertex fn main_vs(
  @location(0) inPos: vec2f,
  @location(1) halfSideLengths: vec2f,
  @location(2) direction1: vec2f,
  @location(3) direction2: vec2f,
  @location(4) inColor: vec3f,
  @location(5) opacity: f32,
  @location(6) conic: vec3f,
  @location(7) depth: f32,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
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
  vsOut.position = vec4f(ndc, depth, 1.0);
  vsOut.splatPosition = inPos;
  vsOut.color = inColor;
  vsOut.opacity = opacity;
  vsOut.conic = conic;
  vsOut.instanceIndex = instanceIndex;
  return vsOut;
}

// Chris Wellons' bit scrambling function for 32-bit integers with low statistical bias
// See: https://nullprogram.com/blog/2018/07/31/
fn lowbias32(z: u32) -> u32 {
var x = z;
x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16;
return x;
}
// Four-input hash built from Wellons' lowbias32 scrambler
fn hash4(a: u32, b: u32, c: u32, d: u32) -> u32 {
var h = 0u;
h ^= lowbias32(a + 0x9e3779b9u); h ^= lowbias32(b + 0x243f6a88u);
h ^= lowbias32(c + 0xb7e15162u); h ^= lowbias32(d + 0xdeadbeefu);
return lowbias32(h);
}
// Convert to floating point number in [0,1]
fn rnd(t: u32) -> f32 { return f32(t)/f32(0xffffffff); }

@fragment fn main_fs(in: VSOut) -> @location(0) vec4f {
  let d = in.position.xy - in.splatPosition;
  let exponent = -0.5 * (
    in.conic.x * d.x * d.x +
    2.0 * in.conic.y * d.x * d.y +
    in.conic.z * d.y * d.y
  );
  let alpha = in.opacity * exp(exponent);
  let pixel = vec2u(in.position.xy);
  let random = rnd(hash4(u32(pixel.x), u32(pixel.y), in.instanceIndex, 0u));
  if (random >= alpha) {
    discard;
  }
  return vec4f(in.color, 1.0);
}