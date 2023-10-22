struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

fn msign(x: f32) -> f32 { 
  if (x < 0.0) {
    return -1.0;
  } else {
    return 1.0;
  }
}

fn sdEllipse(p_in: vec2f, ab_in: vec2f ) -> f32 {
	var p = abs( p_in ); 
  var ab = ab_in;
  if(p.x > p.y) {
    p = p.yx;
    ab = ab.yx;
  }
	
	let l = ab.y*ab.y - ab.x*ab.x;
	
  let m = ab.x*p.x/l; 
	let n = ab.y*p.y/l; 
  let m2 = m*m;
	let n2 = n*n;
	
  let c = (m2+n2-1.0)/3.0; 
	let c3 = c*c*c;

  let d = c3 + m2*n2;
  let q = d  + m2*n2;
  let g = m  + m*n2;

  var co: f32;

  if( d<0.0 ) {
    let h = acos(q/c3)/3.0;
    let s = cos(h) + 2.0;
    let t = sin(h) * sqrt(3.0);
    let rx = sqrt( m2-c*(s+t) );
    let ry = sqrt( m2-c*(s-t) );
    co = ry + sign(l)*rx + abs(g)/(rx*ry);
  }
  else {
    let h = 2.0*m*n*sqrt(d);
    let s = msign(q+h)*pow( abs(q+h), 1.0/3.0 );
    let t = msign(q-h)*pow( abs(q-h), 1.0/3.0 );
    let rx = -(s+t) - c*4.0 + 2.0*m2;
    let ry =  (s-t)*sqrt(3.0);
    let rm = sqrt( rx*rx + ry*ry );
    co = ry/sqrt(rm-rx) + 2.0*g/rm;
  }
  co = (co-m)/2.0;

  let si = sqrt( max(1.0-co*co,0.0) );
 
  let r: vec2f = ab * vec2(co,si);
	
  return length(r-p) * msign(p.y-r.y);
}

// ported from https://www.shadertoy.com/view/4sS3zz
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let fragCoord: vec2f = vec2f(f32(global_id.x), f32(global_id.y));
	let p = (2.0*fragCoord-params.iResolution.xy)/params.iResolution.y;

  let ra = vec2f(0.5,0.21) + 0.2*cos(params.iTime*vec2f(1.1,1.3)+vec2f(0.0,1.0) );
	
 	let d = sdEllipse( p, ra );
    
  var col = vec3f(1.0) - sign(d)*vec3f(0.1,0.4,0.7);
	col *= 1.0 - exp(-2.0*abs(d));
	col *= 0.8 + 0.2*cos(120.0*d);
	col = mix( col, vec3f(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );

  // For another day once we support mouse input :)
    // if( iMouse.z>0.001 )
    // {
    // d = sdEllipse(m, ra );
    // col = mix(col, vec3(1.0,1.0,0.0), 1.0-smoothstep(0.0, 0.005, abs(length(p-m)-abs(d))-0.0025));
    // col = mix(col, vec3(1.0,1.0,0.0), 1.0-smoothstep(0.0, 0.005, length(p-m)-0.015));
    // }

  let fragColor = vec4f(col, 1.0);
  let outputCoord = vec2u(global_id.x, global_id.y);
  textureStore(outputTex, outputCoord, fragColor);
}