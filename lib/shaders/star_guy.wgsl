struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

// hash without sine: https://www.shadertoy.com/view/4djSRW
fn hash11(p: f32) -> f32 {
	var p3  = fract(vec3f(p) * vec3f(.1031, .11369, .13787));
  p3 += dot(p3, p3 + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

// 1d smooth noise
fn snoise1d(f: f32) -> f32 {
    return
        mix(
            hash11(floor(f)),
            hash11(floor(f+1.0)),
            smoothstep(0.0, 1.0, fract(f))
        );
}

/* star shape (2d distance estimate)
   p = input coordinate
   n = number of sides
   r = radius
   i = inset amount (0.0=basic polygon, 1.0=typical star
*/
fn StarDE(p_in: vec2f, n: f32, r: f32, i: f32) -> f32 {
    var p = p_in;
    let rep = floor(-atan2(p.x, p.y)*(n/6.28)+0.5) / (n/6.28);
    var s: f32;
    var c: f32;
    c=cos(rep);
    s = -sin(rep);
    p = mat2x2f(c, s, -s, c) * p;
    let a = (i+1.0) * 3.14 / n;
    s=-sin(a);
    c=cos(a);
    p = mat2x2(c, s, -s, c) * vec2f(-abs(p.x), p.y-r);
    return length(max(vec2f(0), p));
}

// StarDE, but with eyes
// l = look
fn Starguy(p: vec2f, n: f32, r: f32, i: f32, l: vec2f) -> f32 {

    // blink
    let b = pow(abs(fract(.087*params.iTime+.1)-.5)*2., 72.);
    
    return
        max(
            StarDE(p, n, r, i),
            
            // eyes basic
            //-length(vec2(abs(p.x)-r*.18, min(0., -abs(p.y)+r*.1)))+r*.11
            
            // eyes with look
            -length(
                vec2f(
                    min(0., -abs(abs(p.x+l.x)-r*.2)+r*b*.1),
                    min(0., -abs(p.y+l.y)+r*(1.-b)*.1)
                )
            )+r*.13
            
        );
}

// Adapted from https://www.shadertoy.com/view/DdKBzz
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let fragCoord: vec2f = vec2f(f32(global_id.x), params.iResolution.y - f32(global_id.y));

	let p = vec2f(fragCoord-params.iResolution.xy/2.) / params.iResolution.y;
	
    // time
  let t = .57 * params.iTime;
    
    // bob up and down
  var p2 = p;
  p2.y += .025 * sin(4.*t);
    
    // warping (pinned inversion)
  p2 = p2 / dot(p2, p2) - .17 * vec2f(sin(t), cos(4.*t));
  p2 = p2 / dot(p2, p2);
    
  let look: vec2f = .02 * vec2f(cos(.71*t), sin(.24*t));
    
    // Starguy
  let star = Starguy(p2, 5., .27, .7-length(p), look);
    
    // radiation base
  var rad = pow(Starguy(p, 5., .27, .7-length(p), look), .5);
    
    // radiating waves
  rad = snoise1d(24.*rad-2.*params.iTime) + .5*snoise1d(48.*rad-4.*params.iTime);
    
    // Starguy + radiation
  let col: vec3f =
        mix(
            vec3f(1.),
            vec3f(.1, .07, .25),
            clamp(star/.01, 0., 1.)
        ) + 4.8 * vec3f(1., .5, .23) * (1.0 - pow(star, .1) ) * (1.-.04*rad);
    
  let fragColor = vec4f(col, 1.0);
  let outputCoord = vec2u(global_id.x, global_id.y);
  textureStore(outputTex, outputCoord, fragColor);
}