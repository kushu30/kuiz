export default function Button({ className="", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm " +
        "bg-neutral-900 text-white hover:bg-neutral-800 " +
        "dark:bg-white dark:text-white dark:hover:bg-neutral-100 " +
        "disabled:opacity-60 disabled:cursor-not-allowed " +
        className
      }
    />
  );
}
