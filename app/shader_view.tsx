"use client";

import { cn } from "@/lib/utils";
import { WebGPURenderer } from "@/lib/webgpu_renderer";
import {
  ComponentPropsWithoutRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface ShaderViewProps extends ComponentPropsWithoutRef<"div"> {
  shaderCode: string;
}

export const ShaderView = ({
  shaderCode,
  className,
  ...props
}: ShaderViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webGPURenderer = useRef<WebGPURenderer | null>(null);

  const [gpuDevice, setGPUDevice] = useState<GPUDevice | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found but must be present here!");

    // Get the GPU device
    const loadDevice = async () => {
      if (!navigator.gpu) throw Error("WebGPU not supported.");

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error("No appropriate GPUAdapter found.");

      const device = await adapter.requestDevice();

      setGPUDevice(device);
    };

    loadDevice();
  }, []);

  useEffect(() => {
    if (!gpuDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found but must be present here!");

    const renderer = new WebGPURenderer(canvas, gpuDevice);
    webGPURenderer.current = renderer;
    webGPURenderer.current.setShader(shaderCode);
    webGPURenderer.current.resizeCanvas();

    webGPURenderer.current.startRendering();
  }, [gpuDevice, shaderCode]);

  useEffect(() => {
    if (!webGPURenderer.current) return;

    webGPURenderer.current.stopRendering();
    webGPURenderer.current.setShader(shaderCode);
    webGPURenderer.current.startRendering();
  }, [shaderCode]);

  return (
    <div className={cn(className)} {...props}>
      <canvas className="w-full h-full" ref={canvasRef} />
    </div>
  );
};
