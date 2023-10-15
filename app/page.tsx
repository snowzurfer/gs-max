"use client";

import { ShaderView } from "./shader_view";
import simple_plasma from "@/lib/shaders/simple_plasma.wgsl";
import { CodeEditor } from "./code_editor";
import { useEffect, useRef, useState } from "react";
import { throttle } from "lodash";

export const Home = () => {
  const [shaderCode, setShaderCode] = useState(simple_plasma);

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
    <div className="flex lg:gap-x-12 items-center">
      <ShaderView
        shaderCode={shaderCode}
        className="max-w-xl w-full aspect-square shadow-xl"
      />

      <div className="max-w-xl shadow-xl">
        <CodeEditor
          initialCode={shaderCode}
          onChange={(value) => {
            throttledOnChangeRef.current(value);
          }}
        />
      </div>
    </div>
  );
};

export default Home;
