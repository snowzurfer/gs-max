struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

struct Box {
    origin: vec3f,
    bounds: vec3f,
};

struct Ray {
    origin: vec3f,
    dir: vec3f,
};

struct HitRecord {
    dist: vec3f,
    ptnt: array<vec3f, 2>,
};

struct Plane {
    origin: vec3f,
    normal: vec3f,
};

fn rayDirection(fieldOfView: f32, size: vec2f, fragCoord: vec2f) -> vec3f {
    var xy = fragCoord - size / 2.0;
    var z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3f(xy, -z));
}

fn viewMatrix(eye: vec3f, center: vec3f, up: vec3f) -> mat4x4f {
    var f = normalize(center - eye);
    var s = normalize(cross(f, up));
    var u = cross(s, f);
    return mat4x4f(
        vec4f(s, 0.0),
        vec4f(u, 0.0),
        vec4f(-f, 0.0),
        vec4f(0.0, 0.0, 0.0, 1.0)
    );
}

fn calcLookAtMatrix(camPosition: vec3f, camTarget: vec3f, roll: f32) -> mat3x3f {
    let ww = normalize(camTarget - camPosition);
    let uu = normalize(cross(ww, vec3f(sin(roll), cos(roll), 0.0)));
    let vv = normalize(cross(uu, ww));

    return mat3x3f(uu, vv, ww);
}

const MAX_MARCHING_STEPS: u32 = 128;
const MIN_FLOAT: f32 = 1.0e-6;
const MAX_FLOAT: f32 = 1.0e6;
const EPSILON: f32 = 0.0001;
const PI: f32 = acos(-1.0);

fn heightAtPos(p: vec3f) -> f32 {
    let val: f32 = cos(clamp(p.x + sin(p.z * 0.5 + params.iTime) * 3.0, -PI, PI)) * 0.5 + 0.5;
    return pow(abs(val), 10.0) * sin(p.z * 0.5 + params.iTime) * 3.0;
}

fn opSubtraction(d1: f32, d2: f32) -> f32 {
    return max(-d1, d2);
}

fn world(p: vec3f) -> f32 {
    let mp: vec3f = p;
    let spacing: f32 = 0.2; // + smoothstep(-5., 5., p.z)*.4;
    let v: f32 = (mp.z % spacing) - spacing * 0.5;
    return opSubtraction(-p.y + heightAtPos(p), opSubtraction(v + 0.001, v - 0.001));
}

const precis: f32 = 0.001;
fn march(eye: vec3f, marchingDirection: vec3f) -> f32 {
    var t: f32 = 0.0;
    for (var i: u32 = 0u; i < MAX_MARCHING_STEPS; i++) {
        let p: vec3f = eye + marchingDirection * t;
        let hit: f32 = world(p);
        if(hit < precis) {
            return t;
        }
        t += hit * 0.25;
    }
    return -1.0;
}

fn color(camPos: vec3f, rayDir: vec3f) -> vec3f {
    var col: vec3f = vec3f(0.0, 0.0, 0.0);
    var pos: vec3f = camPos;
    
    let dis: f32 = march(pos, rayDir);
    if(dis >= 0.0) {
        pos += rayDir * dis;
        let h: f32 = heightAtPos(pos);
        col = vec3f(smoothstep(0.05, 0.0, distance(pos.y, h - 0.05)));
    }
    
    return col;
}

fn makeClr(fragCoord: vec2f) -> vec3f {
    let viewDir: vec3f = rayDirection(60.0, params.iResolution.xy, fragCoord);
    let origin: vec3f = vec3f(0.0, 10.0, 10.0);
    let viewToWorld: mat4x4<f32> = viewMatrix(origin, vec3f(0.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0));
    let dir: vec3f = (viewToWorld * vec4f(viewDir, 1.0)).xyz;
    
    return color(origin, dir);
}

const AA: u32 = 1;
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let fragCoord = vec2f(f32(global_id.x), f32(global_id.y));
    var fragColor: vec3f = vec3f(0.0, 0.0, 0.0);
    for (var y: u32 = 0u; y < AA; y = y + 1u) {
        for (var x: u32 = 0u; x < AA; x = x + 1u) {
            fragColor = fragColor + clamp(makeClr(fragCoord + vec2f(f32(x), f32(y)) / f32(AA)), vec3f(0.0, 0.0, 0.0), vec3f(1.0, 1.0, 1.0));
        }
    }
 
    fragColor /= f32(AA * AA);

    let uv = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, uv, vec4f(fragColor, 1.0));
}