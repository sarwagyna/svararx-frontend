import { clsx } from "clsx";

type PageSize = "default" | "narrow" | "wide";

const SIZE_CLASSES: Record<PageSize, string> = {
  default: "max-w-6xl xl:max-w-7xl",
  narrow: "max-w-3xl xl:max-w-5xl",
  wide: "max-w-7xl",
};

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
  size?: PageSize;
}

export function PageContent({ children, className, size = "default" }: PageContentProps) {
  return (
    <main
      className={clsx(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8",
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </main>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <h1 className="text-2xl lg:text-[32px] font-semibold text-ink tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-mute mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
