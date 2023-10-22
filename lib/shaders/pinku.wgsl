struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

fn colormap_red(x: f32) -> f32 {
    if (x < 0.0) {
        return 54.0 / 255.0;
    } else if (x < 20049.0 / 82979.0) {
        return (829.79 * x + 54.51) / 255.0;
    } else {
        return 1.0;
    }
}

fn colormap_green(x: f32) -> f32 {
    if (x < 20049.0 / 82979.0) {
        return 0.0;
    } else if (x < 327013.0 / 810990.0) {
        return (8546482679670.0 / 10875673217.0 * x - 2064961390770.0 / 10875673217.0) / 255.0;
    } else if (x <= 1.0) {
        return (103806720.0 / 483977.0 * x + 19607415.0 / 483977.0) / 255.0;
    } else {
        return 1.0;
    }
}

fn colormap_blue(x: f32) -> f32 {
    if (x < 0.0) {
        return 54.0 / 255.0;
    } else if (x < 7249.0 / 82979.0) {
        return (829.79 * x + 54.51) / 255.0;
    } else if (x < 20049.0 / 82979.0) {
        return 127.0 / 255.0;
    } else if (x < 327013.0 / 810990.0) {
        return (792.02249341361393720147485376583 * x - 64.364790735602331034989206222672) / 255.0;
    } else {
        return 1.0;
    }
}

fn colormap(x: f32) -> vec4f {
    return vec4f(colormap_red(x), colormap_green(x), colormap_blue(x), 1.0);
}


fn rand(n: vec2f) -> f32 { 
    return fract(sin(dot(n, vec2f(12.9898, 4.1414))) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
    let ip = floor(p);
    var u = fract(p);
    u = u*u*(3.0-2.0*u);

    let res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

const mtx = mat2x2f( 0.80,  0.60, -0.60,  0.80 );

fn fbm(p_in: vec2f) -> f32 {
    var f: f32 = 0.0;
    var p = p_in;

    f += 0.500000*noise( p + params.iTime  ); p = mtx*p*2.02;
    f += 0.031250*noise( p ); p = mtx*p*2.01;
    f += 0.250000*noise( p ); p = mtx*p*2.03;
    f += 0.125000*noise( p ); p = mtx*p*2.01;
    f += 0.062500*noise( p ); p = mtx*p*2.04;
    f += 0.015625*noise( p + sin(params.iTime) );

    return f/0.96875;
}

fn pattern(p: vec2f ) -> f32 {
	return fbm( p + fbm( p + fbm( p ) ) );
}

// Adapted from https://www.shadertoy.com/view/ftSSRR
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let fragCoord: vec2f = vec2f(f32(global_id.x), f32(global_id.y));
    let uv: vec2f = fragCoord/params.iResolution.xy;
	let shade = pattern(uv);
    let fragColor = vec4f(colormap(shade).rgb, shade);
    let outputCoord = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, outputCoord, fragColor);
}