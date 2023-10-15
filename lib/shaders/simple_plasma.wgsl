struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

// Adapted from https://www.shadertoy.com/view/ldBGRR
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let p = vec2(-1.0 + 2.0 * f32(global_id.x) / params.iResolution.x, -1.0 + 2.0 * f32(global_id.y) / params.iResolution.y);

    let x = p.x;
    let y = p.y;
    let mov0 = x + y + cos(sin(params.iTime) * 2.0) * 100.0 + sin(x / 100.0) * 1000.0;
    let mov1 = y / 0.9 + params.iTime;
    let mov2 = x / 0.2;
    let c1 = abs(sin(mov1 + params.iTime) / 2.0 + mov2 / 2.0 - mov1 - mov2 + params.iTime);
    let c2 = abs(sin(c1 + sin(mov0 / 1000.0 + params.iTime) + sin(y / 40.0 + params.iTime) + sin((x + y) / 100.0) * 3.0));
    let c3 = abs(sin(c2 + cos(mov1 + mov2 + c2) + cos(mov2) + sin(x / 1000.0)));
    let fragColor = vec4(c1, c2, c3, 1.0);

    let uv = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, uv, fragColor);
}

// Adapted from https://www.shadertoy.com/view/tsKSzR