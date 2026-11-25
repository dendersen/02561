struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(perspective) normal: vec3f,
};

struct Uniforms {
  mvp: mat4x4f,
  lightDirection: vec4f,
  lightEmission: vec4f,
  lightAmbient: vec4f,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var textureSampler: sampler;

@group(0) @binding(2)
var diffuseTexture: texture_2d<f32>;

@vertex
fn main_vs(@location(0) inPos: vec4f) -> VSOut {
  let normal = normalize(inPos.xyz);
  return VSOut(
    uniforms.mvp * inPos,
    normal
  );
}

@fragment
fn main_fs(
  @location(0) @interpolate(perspective) normal: vec3f
) -> @location(0) vec4f {
  let direction = normalize(normal);
  let pi = 3.141592653589793;
  let texcoord = vec2f(
    atan2(direction.z, direction.x) / (2.0 * pi) + 0.5,
    asin(clamp(direction.y, -1.0, 1.0)) / pi + 0.5
  );
  let dx = dpdx(texcoord);
  let dy = dpdy(texcoord);
  let wrappedDx = vec2f(dx.x - round(dx.x), dx.y);
  let wrappedDy = vec2f(dy.x - round(dy.x), dy.y);
  let kd = textureSampleGrad(
    diffuseTexture, textureSampler, texcoord, wrappedDx, wrappedDy
  );
  let toLight = normalize(-uniforms.lightDirection.xyz);
  let diffuse = uniforms.lightEmission.xyz * max(dot(direction, toLight), 0.0);
  return vec4f(kd.rgb * (uniforms.lightAmbient.xyz + diffuse), kd.a);
}
