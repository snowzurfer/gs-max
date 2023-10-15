"use client";

import { ShaderView } from "./shader_view";
import simple_plasma from "@/lib/shaders/simple_plasma.wgsl";
import synth_wave from "@/lib/shaders/synth_wave.wgsl";
import lava from "@/lib/shaders/lava.wgsl";
import { CodeEditor } from "./code_editor";
import { useEffect, useRef, useState } from "react";
import { throttle } from "lodash";

export const Editor = () => {
  const [shaderCode, setShaderCode] = useState(lava);
  const [showEditor, setShowEditor] = useState(true);

  // Using useRef to create a mutable object which holds the throttled function.
  // This object will persist for the full lifetime of the component.
  const throttledOnChangeRef = useRef(
    throttle(
      (code: string) => {
        setShaderCode(code);
      },
      1100,
      {
        leading: false,
      }
    )
  );

  useEffect(() => {
    // Cleanup: cancel any pending executions of the throttled function
    // when the component is unmounted.
    return () => {
      throttledOnChangeRef.current.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex flex-col lg:flex-row lg:gap-x-12 items-center justify-center">
        <div className="flex flex-col max-w-xl shadow-xl">
          <ShaderView
            shaderCode={shaderCode}
            className="max-w-xl w-full aspect-square"
          />
          {!showEditor && (
            <button onClick={() => setShowEditor((show) => !show)}>
              <span className="text-gray-900 dark:text-gray-100">show 👁️</span>
            </button>
          )}
        </div>

        {showEditor && (
          <div className="flex flex-col max-w-xl shadow-xl">
            <CodeEditor
              initialCode={shaderCode}
              onChange={(value) => {
                throttledOnChangeRef.current(value);
              }}
            />
            <button onClick={() => setShowEditor((show) => !show)}>
              <span className="text-gray-900 dark:text-gray-100">hide 👁️</span>
            </button>
          </div>
        )}
      </div>
      <footer className="h-12 flex items-center justify-center">
        <span className="text-gray-900 dark:text-gray-100">
          by{" "}
          <a
            href="https://albertotaiuti.com"
            className="text-blue-500 hover:underline focus:outline-none focus:border-b-2 focus:border-blue-500 active:text-blue-700"
          >
            Alberto Taiuti
          </a>
          - v0.1
        </span>
      </footer>
    </div>
  );
};
