
struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

const strength: f32 = 0.4;

// Ported from https://www.shadertoy.com/view/ttlGDf 
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let t = params.iTime / 3.0;
    
    var col = vec3f(0);
    let fragCoord: vec2f = vec2f(f32(global_id.x), params.iResolution.y - f32(global_id.y));
    var fc = fragCoord;

    for(var i: i32 = -1; i <= 1; i++) {
        for(var j: i32 = -1; j <= 1; j++) {
            fc = fragCoord + vec2f(f32(i) , f32(j)) / 3.0;
            
            //Normalized pixel coordinates (from 0 to 1)
            var pos: vec2f = fc / params.iResolution.xy;

            pos.y /= params.iResolution.x / params.iResolution.y;
            pos = 4.0 * (vec2f(0.5) - pos);

            for(var k: f32 = 1.0; k < 7.0; k+=1.0){ 
                pos.x += strength * sin(2.0*t+k*1.5 * pos.y)+t*0.5;
                pos.y += strength * cos(2.0*t+k*1.5 * pos.x);
            }

            col += 0.5 + 0.5*cos(params.iTime+pos.xyx+vec3(0,2,4));
            
        }
    }

    col /= 9.0;
    
    //Gamma
    col = pow(col, vec3(0.4545));
    
    //Fragment colour
    let outputCoord = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, outputCoord, vec4f(col,1.0));
}