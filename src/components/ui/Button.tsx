// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from "react";

export default function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium " +
        "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm " +
        "disabled:opacity-60 disabled:cursor-not-allowed " +
        className
      }
    />
  );
}
