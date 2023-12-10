struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

fn makeR(a: f32) -> mat2x2f {
  let res = cos(a / 4.0 + vec4f(0.0, 11.0, 33.0, 0.0));
  return mat2x2f(
    res.xy,
    res.zw,
  );
}

// ported from https://www.shadertoy.com/view/ctGyWK
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let fragCoord: vec2f = vec2f(f32(global_id.x), params.iResolution.y - f32(global_id.y));

  //Initialize hue and clear fragcolor
  var h = vec4f(0.0);
  var o: vec4f = h + vec4f(1.0);

  //Uvs and resolution for scaling
  let r = params.iResolution.xy;
  var u = vec2f(0.0);
  
  //Alpha, length, angle and iterator/radius
  var A: f32 = 0.0;
  var l: f32 = 0.0;
  var a: f32 = 0.0;
  for(var i: f32 = 0.6; i > 0.1; i -= 0.1) {
    // Smoothly rotate a quarter at a time
    a = (params.iTime + i) * 4.0;
    a -= sin(a);
    a -= sin(a);

    // Scale and center
    u = (fragCoord + fragCoord - r) / r.y;

    // Compute round square SDF
    let R = makeR(a);
    u -= R * clamp(u * R, vec2f(-i), vec2f(i));
    l = max(length(u), 0.1);

    // Compute anti-aliased alpha using SDF
    A = min((l - 0.1) * r.y * 0.2, 1.0);

    // Pick layer color
    h = sin(i / 0.1 + a / 3.0 + vec4f(1, 3, 5, 0)) * 0.2 + 0.7;
    o = mix(h, o, A);

    // Soft shading
    o *= mix(h / h, h + 0.5 * A * u.y / l, 0.1 / l);
  }
        
  let outputCoord = vec2u(global_id.x, global_id.y);
  textureStore(outputTex, outputCoord, o);
}