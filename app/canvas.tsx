"use client";

import { main } from "@/lib/shadertoy_02";
import { useLayoutEffect, useRef } from "react";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found but must be present here!");

    main(canvas);
  }, []);

  return <canvas className="w-full h-full" ref={canvasRef} />
};
