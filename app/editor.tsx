"use client";

import { ShaderView } from "./shader_view";
import simple_plasma from "@/lib/shaders/simple_plasma.wgsl";
import lava from "@/lib/shaders/lava.wgsl";
import pinku from "@/lib/shaders/pinku.wgsl";
import ellipse_2d_distance from "@/lib/shaders/ellipse_2d_distance.wgsl";
import star_guy from "@/lib/shaders/star_guy.wgsl";
import ovanova_blu_color from "@/lib/shaders/ovanova_blu_color.wgsl";
import rainbow_dna from "@/lib/shaders/rainbow_dna.wgsl";
import origami from "@/lib/shaders/origami.wgsl";
import warp from "@/lib/shaders/warp.wgsl";
import distanceMergingTheory from "@/lib/shaders/DistanceMergingTheory.wgsl";
import { CodeEditor } from "./code_editor";
import { useEffect, useRef, useState } from "react";
import { throttle } from "lodash";

const shaders = [
  {
    name: "simple plasma",
    code: simple_plasma,
  },
  {
    name: "pinku",
    code: pinku,
  },
  {
    name: "lava",
    code: lava,
  },
  {
    name: "ellipse 2d distance",
    code: ellipse_2d_distance,
  },
  {
    name: "star guy",
    code: star_guy,
  },
  {
    name: "ovanova blu color",
    code: ovanova_blu_color,
  },
  {
    name: "rainwbow dna",
    code: rainbow_dna,
  },
  {
    name: "origami",
    code: origami,
  },
  {
    name: "warp",
    code: warp,
  },
  {
    name: "distance merging theory",
    code: distanceMergingTheory,
  },
];

const buttonClassName =
  "hover:bg-gray-400 active:bg-gray-500 dark:hover:bg-gray-600 dark:active:bg-gray-500";

export const Editor = () => {
  const [shaderCode, setShaderCode] = useState(warp);
  const [showEditor, setShowEditor] = useState(true);
  const [showSelectShader, setShowSelectShader] = useState(false);

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
            <button
              onClick={() => setShowEditor((show) => !show)}
              className={buttonClassName}
            >
              <span className="text-gray-900 dark:text-gray-100">show 👁️</span>
            </button>
          )}
        </div>

        {showEditor && (
          <div className="flex flex-col shadow-xl grow max-w-xl">
            {showSelectShader && (
              <div className="flex flex-col gap-y-2 w-full">
                {shaders.map((shader) => (
                  <button
                    key={shader.name}
                    onClick={() => {
                      setShaderCode(shader.code);
                      setShowSelectShader(false);
                    }}
                    className={buttonClassName}
                  >
                    <span className="text-gray-900 dark:text-gray-100">
                      {shader.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowSelectShader(false)}
                  className="bg-gray-300 hover:bg-gray-400 active:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500"
                >
                  <span className="text-gray-900 dark:text-gray-100">
                    cancel
                  </span>
                </button>
              </div>
            )}
            {!showSelectShader && (
              <>
                <CodeEditor
                  initialCode={shaderCode}
                  onChange={(value) => {
                    throttledOnChangeRef.current(value);
                  }}
                />
                <button
                  onClick={() => setShowEditor((show) => !show)}
                  className={buttonClassName}
                >
                  <span className="text-gray-900 dark:text-gray-100">
                    hide 👁️
                  </span>
                </button>
                <button
                  onClick={() => setShowSelectShader(true)}
                  className={buttonClassName}
                >
                  <span className="text-gray-900 dark:text-gray-100">
                    pick shader️
                  </span>
                </button>
              </>
            )}
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
