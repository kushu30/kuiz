// src/components/ui/Card.tsx
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl border border-neutral-200 bg-white " + className}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={"p-4 sm:p-5 " + className}>{children}</div>;
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-neutral-100 p-4 sm:p-5">
      <div className="font-medium">{title}</div>
      {subtitle ? <div className="text-sm text-neutral-500">{subtitle}</div> : null}
    </div>
  );
}
