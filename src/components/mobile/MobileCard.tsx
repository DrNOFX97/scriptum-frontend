import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  expandable?: boolean;
}

export const MobileCard = ({
  title,
  description,
  icon,
  children,
  onClick,
  className,
  expandable = false,
}: MobileCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl border border-border overflow-hidden transition-all duration-200",
        onClick && "active:scale-[0.98] cursor-pointer",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {(expandable || onClick) && (
          <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      {children && <div className="px-4 pb-4 pt-0">{children}</div>}
    </div>
  );
};

/* Compact list item for mobile */
export const MobileListItem = ({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-200 text-left"
    >
      {icon && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {badge && <div className="flex-shrink-0">{badge}</div>}

      <ChevronRight className="flex-shrink-0 h-4 w-4 text-muted-foreground" />
    </button>
  );
};
