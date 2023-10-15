"use client";

import { WebGPURenderer } from "@/lib/webgpu_renderer";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface ShaderViewProps {
  shaderCode: string;
}

export const ShaderView = ({ shaderCode }: ShaderViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webGPURenderer = useRef<WebGPURenderer | null>(null);

  const [gpuDevice, setGPUDevice] = useState<GPUDevice | null>(null);

  useLayoutEffect(() => {
    console.log("Canvas mounted");
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found but must be present here!");

    // Get the GPU device
    const loadDevice = async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error("No appropriate GPUAdapter found.");

      const device = await adapter.requestDevice();

      setGPUDevice(device);
    };

    loadDevice();
  }, []);

  useEffect(() => {
    console.log("GPU device changed");
    if (!gpuDevice) return;

    console.log("GPU device loaded");

    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found but must be present here!");

    const renderer = new WebGPURenderer(canvas, gpuDevice);
    webGPURenderer.current = renderer;
    webGPURenderer.current.setShader(shaderCode);
    webGPURenderer.current.resizeCanvas();
    // renderer.start();

    // return () => {
    //   renderer.stop();
    // };

    webGPURenderer.current.startRendering();
  }, [gpuDevice]);

  useEffect(() => {
    if (!webGPURenderer.current) return;

    console.log("Shader code changed");

    webGPURenderer.current.setShader(shaderCode);
  }, [shaderCode]);

  return <canvas className="w-full h-full" ref={canvasRef} />;
};
