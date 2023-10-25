struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

// ported from https://www.shadertoy.com/view/wlsyDH
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let fragCoord: vec2f = vec2f(f32(global_id.x), params.iResolution.y - f32(global_id.y));

  var o = vec4(0.0);
  var u = normalize(vec3f(2.0 * fragCoord - params.iResolution.xy, params.iResolution.y));
  for(var i: i32 = 0; i < 6; i++) {
    u.x += sin(u.z + params.iTime * 0.1);
    u.y += cos(u.x + params.iTime * 0.1);
    o = max(o * 0.9, cos(3.0 * dot(u,u) * vec4f(0.3, 0.1, 0.2, 0)));
  }
  
  let outputCoord = vec2u(global_id.x, global_id.y);
  textureStore(outputTex, outputCoord, o);
}