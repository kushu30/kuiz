import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "cancel";
}

export default function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantClasses =
    variant === "outline"
      ? "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 shadow-none "
      : variant === "cancel"
      ? "border border-neutral-200 bg-white text-neutral-900 hover:bg-black hover:text-white hover:border-black shadow-none "
      : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm ";

  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 " +
        variantClasses +
        "disabled:opacity-60 disabled:cursor-not-allowed " +
        className
      }
    />
  );
}
