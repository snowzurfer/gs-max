import triangleWGSL from "@/lib/shaders/triangle.wgsl";

export const main = async (canvas: HTMLCanvasElement) => {
  console.log("main");

  if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
  console.log("WebGPU supported");

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No appropriate GPUAdapter found.");
  console.log("GPUAdapter found");

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  if (!context)
    throw new Error("Couldn't get the WebGPU context from the canvas");
  console.log("WebGPU context obtained from canvas");

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });
  console.log("WebGPU context configured");

  const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, 0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
  ]);

  const indices = new Uint32Array([0, 1, 2, 2, 3, 0]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const vertexBufferLayout: GPUVertexBufferLayout = {
    attributes: [
      {
        format: "float32x2" as GPUVertexFormat,
        offset: 0,
        shaderLocation: 0,
      },
    ],
    arrayStride: 2 * 4,
    stepMode: "vertex",
  };

  const indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(indexBuffer, 0, indices);

  const triangleShaderModule = device.createShaderModule({
    code: triangleWGSL,
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: triangleShaderModule,
      entryPoint: "vert_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: triangleShaderModule,
      entryPoint: "frag_main",
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list" as GPUPrimitiveTopology,
      // stripIndexFormat: undefined,
      // frontFace: "ccw" as GPUFrontFace,
      // cullMode: "none" as GPUCullMode,
    },
  });

  const encoder = device.createCommandEncoder();

  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear" as GPULoadOp,
        clearValue: { r: 0.0, g: 0.0, b: 0.1, a: 1.0 },
        storeOp: "store" as GPUStoreOp,
      },
    ],
  });

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint32");
  pass.drawIndexed(indices.length, 1, 0, 0, 0);

  pass.end();

  console.log("WebGPU render pass created");

  const commandBuffer = encoder.finish();

  device.queue.submit([commandBuffer]);

  console.log("WebGPU command buffer submitted");
};
