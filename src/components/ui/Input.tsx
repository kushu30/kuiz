import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm " +
        "placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 " +
        className
      }
    />
  );
}
