"use client";

import { cn } from "@/lib/utils";
import CodeMirror from "@uiw/react-codemirror";

interface CodeEditorProps {
  initialCode: string;
  className?: string;
  onChange?: (code: string) => void;
}

export const CodeEditor = ({
  initialCode,
  className,
  onChange,
}: CodeEditorProps) => {
  return (
    <CodeMirror
      value={initialCode}
      className={cn(className, "w-full h-full")}
      onChange={(value, viewUpdate) => {
        onChange?.(value);
      }}
      height="500px"
    />
  );
};
