struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(linear) color: vec3f,
};

struct Uniforms {
  mvp: mat4x4f,
  lightDirection: vec4f,
  lightEmission: vec4f,
  lightAmbient: vec4f,
  diffuseColor: vec4f,
  specularColor: vec4f,
  material: vec4f,
  eyePosition: vec4f,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@fragment
fn main_fs(@location(0) @interpolate(linear) color: vec3f) -> @location(0) vec4f {
  return vec4f(color, 1.0);
}

@vertex
fn main_vs(
  @location(0) inPos: vec4f,
  @location(1) inColor: vec3f
) -> VSOut {
  let normal = normalize(inPos.xyz);
  let toLight = normalize(-uniforms.lightDirection.xyz);
  let toEye = normalize(uniforms.eyePosition.xyz - inPos.xyz);
  let diffuseFactor = max(dot(normal, toLight), 0.0);
  let reflectedLight = reflect(-toLight, normal);
  let specularFactor = pow(
    max(dot(reflectedLight, toEye), 0.0),
    uniforms.material.z
  );
  let ambient = uniforms.material.x * uniforms.lightAmbient.xyz *
    uniforms.diffuseColor.xyz;
  let diffuse = uniforms.material.x * uniforms.lightEmission.xyz *
    uniforms.diffuseColor.xyz * diffuseFactor;
  let specular = uniforms.material.y * uniforms.lightEmission.xyz *
    uniforms.specularColor.xyz * specularFactor;
  return VSOut(
    uniforms.mvp * inPos,
    ambient + diffuse + specular
  );
}