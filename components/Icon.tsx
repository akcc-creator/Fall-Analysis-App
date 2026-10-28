import React from "react";
const paths: Record<string, string> = {
  shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z M8 12l3 3 5-6",
  camera: "M4 7h4l2-3h4l2 3h4v13H4V7Z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  upload: "M12 16V3m-5 5 5-5 5 5 M4 15v6h16v-6",
  file: "M14 3H5v18h14V8l-5-5Zm0 0v5h5 M8 12h8M8 16h6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  copy: "M9 9h12v12H9V9ZM15 5V3H3v12h2",
  print: "M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7v-7Z",
  alert: "m12 3 10 18H2L12 3Zm0 6v5m0 3v.1",
  home: "m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
};
export default function Icon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.file} />
    </svg>
  );
}
