struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(linear) color: vec3f,
};
@fragment fn main_fs(@location(0) @interpolate(linear) inColor: vec3f) -> @location(0) vec4f {
  return vec4f(inColor, 1.0);
}
struct Uniforms {
  mvp: mat4x4f,
};
@group(0) @binding(0)
var<uniform> uniforms: Uniforms;
@vertex
fn main_vs(@location(0) inPos: vec4f, @location(1) inColor: vec3f) -> VSOut
{
  return VSOut(uniforms.mvp * inPos, inColor);
}