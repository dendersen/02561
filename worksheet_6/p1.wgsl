struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(perspective) texcoord: vec2f,
};

struct Uniforms {
  mvp: mat4x4f,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var textureSampler: sampler;

@group(0) @binding(2)
var diffuseTexture: texture_2d<f32>;

@fragment
fn main_fs(
  @location(0) @interpolate(perspective) texcoord: vec2f
) -> @location(0) vec4f {
  return textureSample(diffuseTexture, textureSampler, texcoord);
}

@vertex
fn main_vs(
  @location(0) inPos: vec4f,
  @location(2) inTexcoord: vec2f
) -> VSOut {
  return VSOut(
    uniforms.mvp * inPos,
    inTexcoord
  );
}