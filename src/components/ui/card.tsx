import { HTMLAttributes } from "react";
import Link from "next/link";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${
        interactive ? "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/** Same visual treatment as Card, but the whole surface is a clickable link. */
export function CardLink({ href, className = "", children, ...props }: CardLinkProps) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
