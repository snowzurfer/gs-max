import fullScreenWGSL from "@/lib/shaders/fullscreen.wgsl";

const WORKGROUP_SIZE = {
  x: 8,
  y: 8,
  z: 1,
};

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private computePipelineLayout: GPUPipelineLayout;
  private computeParamsBuffer: GPUBuffer;
  private computeOutputTexture?: GPUTexture;
  private computeBindGroup?: GPUBindGroup;
  private computeBindGroupLayout: GPUBindGroupLayout;
  private computePipeline?: GPUComputePipeline;
  private computeWorkItems = {
    x: 1,
    y: 1,
    z: 1,
  };

  private sampler: GPUSampler;
  private showResultBindGroup?: GPUBindGroup;
  private showResultBindGroupLayout: GPUBindGroupLayout;
  private showResultPipeline?: GPURenderPipeline;

  private pause = true;

  constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    this.canvas = canvas;
    this.device = device;

    // Initialization logic for class properties...
    const context = this.canvas.getContext("webgpu") ?? undefined;
    if (!context)
      throw new Error("Couldn't get the WebGPU context from the canvas");
    this.context = context;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
    });

    this.computeBindGroupLayout = this.device.createBindGroupLayout({
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

    this.computePipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.computeBindGroupLayout], // @group(0)
    });

    /**
    struct Params {
      iTime: f32,
      iResolution: vec3f,
    };
   */
    this.computeParamsBuffer = this.device.createBuffer({
      // iResolution: vec3f (4 * 3 bytes)
      // iTime: f32 (4 bytes)
      size: 4 + 4 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Write a phony time value to the buffer, but real resolution of the canvas
    const paramsBufferArray = new Float32Array(1);
    paramsBufferArray[0] = 0.0;

    this.device.queue.writeBuffer(
      this.computeParamsBuffer,
      4 * 3,
      paramsBufferArray
    );

    this.showResultBindGroupLayout = this.device.createBindGroupLayout({
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

    const fullScreenQuadPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.showResultBindGroupLayout], // @group(0)
    });

    const fullScreenQuadShaderModule = this.device.createShaderModule({
      code: fullScreenWGSL,
    });

    this.showResultPipeline = this.device.createRenderPipeline({
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

    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
  }

  setShader(shaderCode: string) {
    const device = this.device;
    if (!device) throw new Error("Device not initialized");

    // Logic for updating the shader, you might want to create and store
    // a new pipeline with the given shaderCode...
    this.computePipeline = device.createComputePipeline({
      label: "Compute Pipeline",
      layout: this.computePipelineLayout,
      compute: {
        module: device.createShaderModule({
          code: shaderCode,
        }),
        entryPoint: "main",
      },
    });

    console.log("New shader set!");
  }

  startRendering() {
    const device = this.device;
    if (!device) throw new Error("Device not initialized");

    const computePipeline = this.computePipeline;
    if (!computePipeline) throw new Error("Compute pipeline not initialized");

    const computeBindGroup = this.computeBindGroup;
    if (!computeBindGroup)
      throw new Error("Compute bind group not initialized");

    const showResultPipeline = this.showResultPipeline;
    if (!showResultPipeline)
      throw new Error("Show result pipeline not initialized");

    const showResultBindGroup = this.showResultBindGroup;
    if (!showResultBindGroup)
      throw new Error("Show result bind group not initialized");

    this.pause = false;
    // Logic to start the rendering/animation loop, might use requestAnimationFrame...
    const timeStart = performance.now() / 1000;
    const frame = () => {
      // Update the time value
      const time = performance.now() / 1000 - timeStart;

      const uniformTypedArray = new Float32Array([time]);
      this.device.queue.writeBuffer(
        this.computeParamsBuffer,
        3 * 4,
        uniformTypedArray.buffer
      );

      const encoder = device.createCommandEncoder();

      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, computeBindGroup);

      computePass.dispatchWorkgroups(
        this.computeWorkItems.x,
        this.computeWorkItems.y,
        this.computeWorkItems.z
      );

      computePass.end();

      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: this.context.getCurrentTexture().createView(),
            loadOp: "clear" as GPULoadOp,
            clearValue: { r: 0.0, g: 0.0, b: 0.1, a: 1.0 },
            storeOp: "store" as GPUStoreOp,
          },
        ],
      });

      pass.setPipeline(showResultPipeline);
      pass.setBindGroup(0, showResultBindGroup);
      pass.draw(6);

      pass.end();

      device.queue.submit([encoder.finish()]);

      console.log("Rendered frame");

      if (this.pause) return;

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  stopRendering() {
    // Logic to stop the rendering/animation loop, if necessary...
    this.pause = true;
  }

  resizeCanvas() {
    const canvas = this.canvas;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
      Math.floor(canvas.clientWidth * devicePixelRatio),
      Math.floor(canvas.clientHeight * devicePixelRatio),
    ];

    canvas.width = presentationSize[0];
    canvas.height = presentationSize[1];

    // Delete old texture
    this.computeOutputTexture?.destroy();

    // Resize the output texture
    const textureSize = {
      width: presentationSize[0],
      height: presentationSize[1],
    };

    this.computeOutputTexture = this.device.createTexture({
      label: "Compute Output Texture",
      size: textureSize,
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });

    // Recreate the bind group
    this.computeBindGroup = this.device.createBindGroup({
      label: "Compute Bind Group",
      layout: this.computeBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.computeParamsBuffer,
          },
        },
        {
          binding: 1,
          resource: this.computeOutputTexture.createView(),
        },
      ],
    });

    this.showResultBindGroup = this.device.createBindGroup({
      label: "Show Result Bind Group",
      layout: this.showResultBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: this.computeOutputTexture.createView(),
        },
      ],
    });

    this.computeWorkItems = {
      x: Math.ceil(textureSize.width / WORKGROUP_SIZE.x),
      y: Math.ceil(textureSize.height / WORKGROUP_SIZE.y),
      z: 1,
    };

    const uniformTypedArray = new Float32Array([
      textureSize.width,
      textureSize.height,
      1.0,
    ]);
    this.device.queue.writeBuffer(
      this.computeParamsBuffer,
      0,
      uniformTypedArray.buffer
    );

    console.log(
      `Canvas resized to ${textureSize.width}, ${textureSize.height}`
    );
  }
}

// export const main = async (canvas: HTMLCanvasElement) => {
//   if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");

//   const adapter = await navigator.gpu.requestAdapter();
//   if (!adapter) throw new Error("No appropriate GPUAdapter found.");

//   const device = await adapter.requestDevice();
//   const context = canvas.getContext("webgpu");
//   if (!context)
//     throw new Error("Couldn't get the WebGPU context from the canvas");

//   const devicePixelRatio = window.devicePixelRatio || 1;
//   const presentationSize = [
//     Math.floor(canvas.clientWidth * devicePixelRatio),
//     Math.floor(canvas.clientHeight * devicePixelRatio),
//   ];

//   canvas.width = presentationSize[0];
//   canvas.height = presentationSize[1];
//   console.log(
//     "Canvas size: ",
//     canvas.width,
//     canvas.height,
//     canvas.clientWidth,
//     canvas.clientHeight
//   );

//   const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
//   context.configure({
//     device,
//     format: presentationFormat,
//   });

//   // Create a texture that's the same size as the canvas target
//   const textureSize = {
//     width: presentationSize[0],
//     height: presentationSize[1],
//   };

//   console.log(
//     "WebGPU presentation format",
//     presentationFormat,
//     "texture size",
//     textureSize,
//     "devicePixelRatio",
//     devicePixelRatio,
//     "presentationSize",
//     presentationSize
//   );

//   const computeBindGroupLayout = device.createBindGroupLayout({
//     entries: [
//       {
//         binding: 0,
//         visibility: GPUShaderStage.COMPUTE,
//         buffer: {
//           type: "uniform" as GPUBufferBindingType,
//         },
//       },
//       {
//         binding: 1,
//         visibility: GPUShaderStage.COMPUTE,
//         storageTexture: {
//           access: "write-only" as GPUStorageTextureAccess,
//           format: "rgba8unorm" as GPUTextureFormat,
//           viewDimension: "2d" as GPUTextureViewDimension,
//         },
//       },
//     ],
//   });

//   const computePipelineLayout = device.createPipelineLayout({
//     bindGroupLayouts: [computeBindGroupLayout], // @group(0)
//   });

//   /**
//     struct Params {
//       iTime: f32,
//       iResolution: vec3f,
//     };
//    */
//   const computeParamsBuffer = device.createBuffer({
//     // iResolution: vec3f (4 * 3 bytes)
//     // iTime: f32 (4 bytes)
//     size: 4 + 4 * 3,
//     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
//   });

//   // Write a phony time value to the buffer, but real resolution of the canvas
//   const paramsBufferArray = new Float32Array(4);
//   paramsBufferArray[0] = textureSize.width;
//   paramsBufferArray[1] = textureSize.height;
//   paramsBufferArray[2] = 1.0;
//   paramsBufferArray[3] = 0.0;

//   device.queue.writeBuffer(computeParamsBuffer, 0, paramsBufferArray);

//   console.log("textureSize", textureSize);

//   const computeOutputTexture = device.createTexture({
//     size: textureSize,
//     format: "rgba8unorm",
//     usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
//   });

//   const computeBindGroup = device.createBindGroup({
//     layout: computeBindGroupLayout,
//     entries: [
//       {
//         binding: 0,
//         resource: {
//           buffer: computeParamsBuffer,
//         },
//       },
//       {
//         binding: 1,
//         resource: computeOutputTexture.createView(),
//       },
//     ],
//   });

//   const computePipeline = device.createComputePipeline({
//     layout: computePipelineLayout,
//     compute: {
//       module: device.createShaderModule({
//         code: toyWGSL,
//       }),
//       entryPoint: "main",
//     },
//   });

//   const fullScreenBindGroupLayout = device.createBindGroupLayout({
//     entries: [
//       {
//         binding: 0,
//         visibility: GPUShaderStage.FRAGMENT,
//         sampler: {},
//       },
//       {
//         binding: 1,
//         visibility: GPUShaderStage.FRAGMENT,
//         texture: {},
//       },
//     ],
//   });

//   const fullScreenQuadPipelineLayout = device.createPipelineLayout({
//     bindGroupLayouts: [fullScreenBindGroupLayout], // @group(0)
//   });

//   const fullScreenQuadShaderModule = device.createShaderModule({
//     code: fullScreenWGSL,
//   });

//   const fullScreenQuadPipeline = device.createRenderPipeline({
//     layout: fullScreenQuadPipelineLayout,
//     vertex: {
//       module: fullScreenQuadShaderModule,
//       entryPoint: "vert_main",
//       buffers: [],
//     },
//     fragment: {
//       module: fullScreenQuadShaderModule,
//       entryPoint: "frag_main",
//       targets: [
//         {
//           format: presentationFormat,
//         },
//       ],
//     },
//     primitive: {
//       topology: "triangle-list" as GPUPrimitiveTopology,
//     },
//   });

//   const sampler = device.createSampler({
//     magFilter: "linear",
//     minFilter: "linear",
//   });

//   const showResultBindGroup = device.createBindGroup({
//     layout: fullScreenQuadPipeline.getBindGroupLayout(0),
//     entries: [
//       {
//         binding: 0,
//         resource: sampler,
//       },
//       {
//         binding: 1,
//         resource: computeOutputTexture.createView(),
//       },
//     ],
//   });

//   const computeWorkItems = {
//     x: Math.ceil(textureSize.width / 8),
//     y: Math.ceil(textureSize.height / 8),
//     z: 1,
//   };

//   console.log("WebGPU command buffer submitted");

//   // Animate!
//   const timeStart = performance.now() / 1000;
//   const frame = () => {
//     // Update the time value
//     const time = performance.now() / 1000 - timeStart;

//     const uniformTypedArray = new Float32Array([time]);
//     device.queue.writeBuffer(
//       computeParamsBuffer,
//       3 * 4,
//       uniformTypedArray.buffer
//     );

//     const encoder = device.createCommandEncoder();

//     const computePass = encoder.beginComputePass();
//     computePass.setPipeline(computePipeline);
//     computePass.setBindGroup(0, computeBindGroup);

//     computePass.dispatchWorkgroups(
//       computeWorkItems.x,
//       computeWorkItems.y,
//       computeWorkItems.z
//     );

//     computePass.end();

//     const pass = encoder.beginRenderPass({
//       colorAttachments: [
//         {
//           view: context.getCurrentTexture().createView(),
//           loadOp: "clear" as GPULoadOp,
//           clearValue: { r: 0.0, g: 0.0, b: 0.1, a: 1.0 },
//           storeOp: "store" as GPUStoreOp,
//         },
//       ],
//     });

//     pass.setPipeline(fullScreenQuadPipeline);
//     pass.setBindGroup(0, showResultBindGroup);
//     pass.draw(6);

//     pass.end();

//     device.queue.submit([encoder.finish()]);

//     requestAnimationFrame(frame);
//   };

//   requestAnimationFrame(frame);
// };
