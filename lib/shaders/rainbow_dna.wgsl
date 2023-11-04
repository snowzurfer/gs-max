struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

// ported from https://www.shadertoy.com/view/mdKBWd
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let fragCoord: vec2f = vec2f(f32(global_id.x), f32(global_id.y));

  let rColor = vec3f(0.9, 0.0, 0.3);
  let gColor = vec3f(0.0, 0.9, 0.3);
  let bColor = vec3f(0.0, 0.3, 0.9);
  let yColor = vec3f(0.9, 0.9, 0.3);
    
  var p = (fragCoord.xy * 2.0 - params.iResolution.xy);
  p /= min(params.iResolution.x, params.iResolution.y);
    
  let a = sin(p.y * 1.5 - params.iTime * 0.1) / 1.0;
  let b = cos(p.y * 1.5 - params.iTime * 0.2) / 1.0;
  let c = sin(p.y * 1.5 - params.iTime * 0.3 + 3.14) / 1.0;
  let d = cos(p.y * 1.5 - params.iTime * 0.5 + 3.14) / 1.0;
    
  let e = 0.1 / abs(p.x + a);
  let f = 0.1 / abs(p.x + b);
  let g = 0.1 / abs(p.x + c);
  let h = 0.1 / abs(p.x + d);
    
  let destColor = rColor * e + gColor * f + bColor * g + yColor * h;
  let fragColor = vec4f(destColor, 1.0);
  let outputCoord = vec2u(global_id.x, global_id.y);

  textureStore(outputTex, outputCoord, fragColor);
}