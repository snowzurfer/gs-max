struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
    let h: f32 = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

fn sdSphere(p: vec3f, s: f32) -> f32 {
  return length(p) - s;
} 

fn map(p: vec3f) -> f32 {
  var d: f32 = 2.0;
	for (var i: u32 = 0; i < 16; i++) {
		let fi = f32(i);
		let time = params.iTime * (fract(fi * 412.531 + 0.513) - 0.5) * 2.0;
		d = opSmoothUnion(
            sdSphere(p + sin(time + fi * vec3(52.5126, 64.62744, 632.25)) * vec3(2.0, 2.0, 0.8), mix(0.5, 1.0, fract(fi * 412.531 + 0.5124))),
			d,
			0.4
		);
	}
	return d;
}

const h: f32 = 1e-5; // or some other value
const k: vec2f = vec2f(1,-1);

fn calcNormal(p: vec3f) -> vec3f {
    return normalize( k.xyy*map( p + k.xyy*h ) + 
                      k.yyx*map( p + k.yyx*h ) + 
                      k.yxy*map( p + k.yxy*h ) + 
                      k.xxx*map( p + k.xxx*h ) );
}

const rayDir: vec3f = vec3f(0.0, 0.0, -1.0);

// Adapted from https://www.shadertoy.com/view/3sySRK
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let fragCoord: vec2f = vec2f(f32(global_id.x), f32(global_id.y));
    let uv: vec2f = fragCoord/params.iResolution.xy;
    
    // screen size is 6m x 6m
    let rayOri: vec3f = vec3f((uv - 0.5) * vec2f(params.iResolution.x/params.iResolution.y, 1.0) * 6.0, 3.0);
	
    var depth: f32 = 0.0;
    var p: vec3f = vec3(0.0);
	
    for(var i: u32 = 0; i < 64; i++) {
      p = rayOri + rayDir * depth;
      let dist = map(p);
      depth += dist;
      if (dist < 1e-6) {
        break;
      }
    }
	
    depth = min(6.0, depth);
    let n: vec3f = calcNormal(p);
    let b: f32 = max(0.0, dot(n, vec3f(0.577)));
    var col: vec3f = (0.5 + 0.5 * cos((b + params.iTime * 3.0) + uv.xyx * 2.0 + vec3f(0,2,4))) * (0.85 + b * 0.35);
    col *= exp( -depth * 0.15 );
	
    // maximum thickness is 2m in alpha channel
    let fragColor = vec4(col, 1.0 - (depth - 0.5) / 2.0);
    let outputCoord = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, outputCoord, fragColor);
}