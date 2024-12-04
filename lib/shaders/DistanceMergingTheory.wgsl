struct Params {
    iResolution: vec3f,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

fn mergeBlobs(d1: f32, d2: f32, d3: f32) -> f32 {
    let k = 22.0;
    return -log(exp(-k*d1) + exp(-k*d2) + exp(-k*d3))/k;
}

fn randomizePos(amplitude: vec2f, fTime: f32) -> vec2f {
    return amplitude * vec2f(
        sin(fTime*1.00) + cos(fTime*0.51),
        sin(fTime*0.71) + cos(fTime*0.43)
    );
}

fn computeColor(d1: f32, d2: f32, d3: f32) -> vec3f {
    let blobDist = mergeBlobs(d1, d2, d3);
    let k = 7.0; // Color blend distance
    let w1 = exp(k*(blobDist-d1)); // R Contribution
    let w2 = exp(k*(blobDist-d2)); // G Contribution
    let w3 = exp(k*(blobDist-d3)); // B Contribution
    
    // Color weighting & normalization
    let pixColor = vec3f(w1, w2, w3)/(w1 + w2 + w3);
    
    return 2.5 * pixColor;
}

struct BlobResult {
    distance: f32,
    color: vec3f,
}

fn distanceToBlobs(p: vec2f) -> BlobResult {
    let mvtAmplitude = 0.15;
    
    // Randomized positions
    let blob1pos = vec2f(-0.250, -0.020) + randomizePos(vec2f(0.35, 0.45)*mvtAmplitude, params.iTime*1.50);
    let blob2pos = vec2f( 0.050,  0.100) + randomizePos(vec2f(0.60, 0.10)*mvtAmplitude, params.iTime*1.23);
    let blob3pos = vec2f( 0.150, -0.100) + randomizePos(vec2f(0.70, 0.35)*mvtAmplitude, params.iTime*1.86);
    
    // Distance from pixel "p" to each blob
    let d1 = length(p - blob1pos);
    let d2 = length(p - blob2pos);
    let d3 = length(p - blob3pos);
    
    // Merge distances
    let distTotBlob = mergeBlobs(d1, d2, d3);
    
    // Compute color
    let blobColor = computeColor(d1, d2, d3);
        
    return BlobResult(abs(distTotBlob), blobColor);
}


// ported from https://www.shadertoy.com/view/ld3Xzn
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let fragCoord = vec2f(f32(global_id.x), params.iResolution.y - f32(global_id.y));
    let uv = (fragCoord - params.iResolution.xy*0.5) / params.iResolution.xx;
    
    let result = distanceToBlobs(uv);
    let dist = result.distance;
    let blobColor = result.color;
    
    let stripeHz = 20.0;  // BW Stripe frequency
    let stripeTh = 0.25;  // Switchover value
    let aa = 0.001;      // Transition width
    let stripeIntensity = smoothstep(
        stripeTh - aa*stripeHz,
        stripeTh + aa*stripeHz,
        abs(fract(dist*stripeHz) - 0.5)
    );
    
    let blobContourIsovalue = 0.113;
    let fBlobLerp = smoothstep(
        blobContourIsovalue - aa,
        blobContourIsovalue + aa,
        dist
    );

    let finalColor = mix(vec4f(blobColor, 1.0), vec4f(stripeIntensity), fBlobLerp);
    
    let outputCoord = vec2u(global_id.x, global_id.y);
    textureStore(outputTex, outputCoord, finalColor);
}
