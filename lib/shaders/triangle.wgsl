struct VertexInput {
    @location(0) pos: vec2f,
};

/**
 * A structure with fields labeled with builtins and locations can also be used
 * as *output* of the vertex shader, which is also the input of the fragment
 * shader.
 */
struct VertexOutput {
    @builtin(position) pos: vec4f,
};

@vertex
fn vert_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.pos = vec4f(in.pos, 0.0, 1.0);
    return out;
}

@fragment
fn frag_main(in: VertexOutput) -> @location(0) vec4f {
    return vec4f(in.pos.x * 0.005, in.pos.y * 0.005, 0.0, 1.0);
}