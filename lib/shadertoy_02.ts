import fullScreenWGSL from "@/lib/shaders/fullscreen.wgsl";
import toyWGSL from "@/lib/shaders/toy.wgsl";

export const main = async (canvas: HTMLCanvasElement) => {
  if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No appropriate GPUAdapter found.");

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  if (!context)
    throw new Error("Couldn't get the WebGPU context from the canvas");

  const devicePixelRatio = window.devicePixelRatio || 1;
  const presentationSize = [
    Math.floor(canvas.clientWidth * devicePixelRatio),
    Math.floor(canvas.clientHeight * devicePixelRatio),
  ];

  canvas.width = presentationSize[0];
  canvas.height = presentationSize[1];
  console.log(
    "Canvas size: ",
    canvas.width,
    canvas.height,
    canvas.clientWidth,
    canvas.clientHeight
  );

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  // Create a texture that's the same size as the canvas target
  const textureSize = {
    width: presentationSize[0],
    height: presentationSize[1],
  };

  console.log(
    "WebGPU presentation format",
    presentationFormat,
    "texture size",
    textureSize,
    "devicePixelRatio",
    devicePixelRatio,
    "presentationSize",
    presentationSize
  );

  const computeBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform" as GPUBufferBindingType,
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        storageTexture: {
          access: "write-only" as GPUStorageTextureAccess,
          format: "rgba8unorm" as GPUTextureFormat,
          viewDimension: "2d" as GPUTextureViewDimension,
        },
      },
    ],
  });

  const computePipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [computeBindGroupLayout], // @group(0)
  });

  /**
    struct Params {
      iTime: f32,
      iResolution: vec3f,
    };
   */
  const computeParamsBuffer = device.createBuffer({
    // iResolution: vec3f (4 * 3 bytes)
    // iTime: f32 (4 bytes)
    size: 4 + 4 * 3,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Write a phony time value to the buffer, but real resolution of the canvas
  const paramsBufferArray = new Float32Array(4);
  paramsBufferArray[0] = textureSize.width;
  paramsBufferArray[1] = textureSize.height;
  paramsBufferArray[2] = 1.0;
  paramsBufferArray[3] = 0.0;

  device.queue.writeBuffer(computeParamsBuffer, 0, paramsBufferArray);

  console.log("textureSize", textureSize);

  const computeOutputTexture = device.createTexture({
    size: textureSize,
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
  });

  const computeBindGroup = device.createBindGroup({
    layout: computeBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: computeParamsBuffer,
        },
      },
      {
        binding: 1,
        resource: computeOutputTexture.createView(),
      },
    ],
  });

  const computePipeline = device.createComputePipeline({
    layout: computePipelineLayout,
    compute: {
      module: device.createShaderModule({
        code: toyWGSL,
      }),
      entryPoint: "main",
    },
  });

  const fullScreenBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      },
    ],
  });

  const fullScreenQuadPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [fullScreenBindGroupLayout], // @group(0)
  });

  const fullScreenQuadShaderModule = device.createShaderModule({
    code: fullScreenWGSL,
  });

  const fullScreenQuadPipeline = device.createRenderPipeline({
    layout: fullScreenQuadPipelineLayout,
    vertex: {
      module: fullScreenQuadShaderModule,
      entryPoint: "vert_main",
      buffers: [],
    },
    fragment: {
      module: fullScreenQuadShaderModule,
      entryPoint: "frag_main",
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list" as GPUPrimitiveTopology,
    },
  });

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  const showResultBindGroup = device.createBindGroup({
    layout: fullScreenQuadPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler,
      },
      {
        binding: 1,
        resource: computeOutputTexture.createView(),
      },
    ],
  });

  const computeWorkItems = {
    x: Math.ceil(textureSize.width / 8),
    y: Math.ceil(textureSize.height / 8),
    z: 1,
  };

  console.log("WebGPU command buffer submitted");

  // Animate!
  const timeStart = performance.now() / 1000;
  const frame = () => {
    // Update the time value
    const time = performance.now() / 1000 - timeStart;

    const uniformTypedArray = new Float32Array([time]);
    device.queue.writeBuffer(
      computeParamsBuffer,
      3 * 4,
      uniformTypedArray.buffer
    );

    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);

    computePass.dispatchWorkgroups(
      computeWorkItems.x,
      computeWorkItems.y,
      computeWorkItems.z
    );

    computePass.end();

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

    pass.setPipeline(fullScreenQuadPipeline);
    pass.setBindGroup(0, showResultBindGroup);
    pass.draw(6);

    pass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};
