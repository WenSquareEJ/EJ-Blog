"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Load the Quill editor only on the client (no SSR)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Import the snow theme CSS on the client
import "react-quill/dist/quill.snow.css";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="prose max-w-none">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
