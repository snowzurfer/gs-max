// fn rayDirection(fieldOfView: f32, size: vec2<f32>, fragCoord: vec2<f32>) -> vec3<f32> {
//     let xy: vec2<f32> = fragCoord - size / 2.0;
//     let z: f32 = size.y / tan(radians(fieldOfView) / 2.0);
//     return normalize(vec3<f32>(xy, -z));
// }

// fn viewMatrix(eye: vec3<f32>, center: vec3<f32>, up: vec3<f32>) -> mat4x4<f32> {
//     let f: vec3<f32> = normalize(center - eye);
//     let s: vec3<f32> = normalize(cross(f, up));
//     let u: vec3<f32> = cross(s, f);
//     return mat4x4<f32>(
//         vec4<f32>(s, 0.0), 
//         vec4<f32>(u, 0.0), 
//         vec4<f32>(-f, 0.0), 
//         vec4<f32>(0.0, 0.0, 0.0, 1.0)
//     );
// }

// fn calcLookAtMatrix(camPosition: vec3<f32>, camTarget: vec3<f32>, roll: f32) -> mat3x3<f32> {
//     let ww: vec3<f32> = normalize(camTarget - camPosition);
//     let uu: vec3<f32> = normalize(cross(ww, vec3<f32>(sin(roll), cos(roll), 0.0)));
//     let vv: vec3<f32> = normalize(cross(uu, ww));

//     return mat3x3<f32>(uu, vv, ww);
// }

struct Params {
    iTime: f32,
    iResolution: vec3f,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;

// const MAX_MARCHING_STEPS: i32 = 128;
// const MIN_FLOAT: f32 = 1e-6;
// const MAX_FLOAT: f32 = 1e6;
// const EPSILON: f32 = 0.0001;
// const PI: f32 = 3.14159265358979323846264;

// fn heightAtPos(p: vec3<f32>) -> f32 {
//     let val: f32 = cos(clamp(p.x + sin(p.z*0.5 + globals.iTime) * 3.0, -PI, PI)) * 0.5 + 0.5;
//     return pow(abs(val), 4.0) * sin(p.z*0.5 + globals.iTime) * 3.0;
// }

// fn opSubtraction(d1: f32, d2: f32) -> f32 {
//     return max(-d1, d2);
// }

// fn world(p: vec3<f32>) -> f32 {
//     var mp: vec3<f32> = p;
//     let spacing: f32 = 0.2;
//     let v: f32 = mod(mp.z, spacing) - spacing * 0.5;
//     return opSubtraction(-p.y + heightAtPos(p), opSubtraction(v + 0.001, v - 0.001));
// }

// fn march(eye: vec3<f32>, marchingDirection: vec3<f32>) -> f32 {
//     let precis: f32 = 0.001;
//     var t: f32 = 0.0;
//     var l: f32 = 0.0;
//     for(var i = 0; i < MAX_MARCHING_STEPS; i = i + 1) {
//         let p: vec3<f32> = eye + marchingDirection * t;
//         let hit: f32 = world(p);
//         if(hit < precis) {
//             return t;
//         }
//         t = t + hit * 0.25;
//     }
//     return -1.0;
// }

// fn color(camPos: vec3<f32>, rayDir: vec3<f32>) -> vec3<f32> {
//     var col: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
//     var pos: vec3<f32> = camPos;
    
//     let dis: f32 = march(pos, rayDir);
//     if(dis >= 0.0) {
//         pos = pos + rayDir * dis;
//         let h: f32 = heightAtPos(pos);
//         col = vec3<f32>(smoothstep(0.05, 0.0, distance(pos.y, h - 0.05)));
//     }
    
//     return col;
// }

// // Note: Ensure to define `rayDirection` and `viewMatrix` or replace them with equivalent logic if necessary
// fn makeClr(fragCoord: vec2<f32>) -> vec3<f32> {
//     let viewDir: vec3<f32> = rayDirection(60.0, globals.iResolution.xy, fragCoord);
//     let origin: vec3<f32> = vec3<f32>(0.0, 10.0, 10.0);
//     let viewToWorld: mat4x4<f32> = viewMatrix(origin, vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(0.0, 1.0, 0.0));
//     let dir: vec3<f32> = (viewToWorld * vec4<f32>(viewDir, 1.0)).xyz;
    
//     return color(origin, dir);
// }

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    // let AA: f32 = 1.0;
    // var fragColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    // for(var y: f32 = 0.0; y < AA; y = y + 1.0) {
    //     for(var x: f32 = 0.0; x < AA; x = x + 1.0) {
    //         fragColor.rgb = fragColor.rgb + clamp(makeClr(FragCoord.xy + vec2<f32>(x, y) / AA), vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 1.0, 1.0));
    //     }
    // }

    // Vary the color based on the global id 
    let fragColor = vec4<f32>(f32(global_id.x) / 255.0, f32(global_id.y) / 255.0, 0.0, 1.0);

    let uv = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, uv, fragColor);
}
