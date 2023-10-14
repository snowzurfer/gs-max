@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) fragUV: vec2f,
}
  
const pos = array(
  vec2( 1.0,  1.0),
  vec2( 1.0, -1.0),
  vec2(-1.0, -1.0),
  vec2( 1.0,  1.0),
  vec2(-1.0, -1.0),
  vec2(-1.0,  1.0),
);

const uv = array(
  vec2(1.0, 0.0),
  vec2(1.0, 1.0),
  vec2(0.0, 1.0),
  vec2(1.0, 0.0),
  vec2(0.0, 1.0),
  vec2(0.0, 0.0),
);

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  var output: VertexOutput;
  output.pos = vec4(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = uv[VertexIndex];
  return output;
}

@fragment
fn frag_main(@location(0) fragUV : vec2f) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, fragUV);
}