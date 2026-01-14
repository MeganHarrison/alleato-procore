"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ header, footer, children, className }: SectionCardProps) {
  return (
    <section className={cn("section-card", className)}>
      {header}
      <div className="section-card-body">{children}</div>
      {footer}
    </section>
  );
}
