struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(linear) color: vec3f,
};
@fragment
fn main_fs(@location(0) @interpolate(linear) color: vec3f) -> @location(0) vec4f {
  return vec4f(color, 1.0);
}
struct Uniforms {
  mvp: mat4x4f,
  lightDirection: vec4f,
  lightEmission: vec4f,
};
@group(0) @binding(0)
var<uniform> uniforms: Uniforms;
@vertex
fn main_vs(
  @location(0) inPos: vec4f,
  @location(1) inColor: vec3f
  ) -> VSOut {
  let normal = normalize(inPos.xyz);
  let toLight = normalize(-uniforms.lightDirection.xyz);
  let diffuse = inColor * uniforms.lightEmission.xyz *
    max(dot(normal, toLight), 0.0);
  return VSOut(
    uniforms.mvp * inPos,
    diffuse
  );
}