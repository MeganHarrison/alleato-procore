import * as React from "react";
import { cn } from "@/lib/utils";
/** * Grid component for multi-column responsive layouts. * Provides a consistent way to create grid-based layouts with design system spacing. * * @example * <Grid cols={3} gap="lg"> * <Card>Column 1</Card> * <Card>Column 2</Card> * <Card>Column 3</Card> * </Grid> * * @example Responsive columns * <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md"> * <StatCard /> * <StatCard /> * <StatCard /> * <StatCard /> * </Grid> */ const gapMap =
  {
    xs: "gap-1", // 4px sm: 'gap-2', // 8px md: 'gap-4', // 16px lg: 'gap-6', // 24px xl: 'gap-8', // 32px '2xl': 'gap-12' // 48px
  } as const;
const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
} as const;
const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;
const justifyMap = {
  start: "justify-items-start",
  center: "justify-items-center",
  end: "justify-items-end",
  stretch: "justify-items-stretch",
} as const;
type ResponsiveCols = {
  base?: keyof typeof colsMap;
  sm?: keyof typeof colsMap;
  md?: keyof typeof colsMap;
  lg?: keyof typeof colsMap;
  xl?: keyof typeof colsMap;
};
export interface GridProps {
  /** Number of columns (responsive object or single number) */ cols?:
    | keyof typeof colsMap
    | ResponsiveCols;
  /** Spacing between grid items */ gap?: keyof typeof gapMap;
  /** Vertical alignment of grid items */ align?: keyof typeof alignMap;
  /** Horizontal alignment of grid items */ justify?: keyof typeof justifyMap;
  /** Render as a different element */ as?:
    | "div"
    | "section"
    | "article"
    | "main"
    | "aside"
    | "nav";
  /** Additional CSS classes */ className?: string;
  /** Child elements */ children: React.ReactNode;
}
export function Grid({
  cols = 1,
  gap = "md",
  align = "stretch",
  justify = "stretch",
  as: Component = "div",
  className,
  children,
}: GridProps) {
  // Handle responsive columns const colsClasses = typeof cols === 'object' ? [ cols.base && colsMap[cols.base], cols.sm && `sm:grid-cols-${cols.sm}`, cols.md && `md:grid-cols-${cols.md}`, cols.lg && `lg:grid-cols-${cols.lg}`, cols.xl && `xl:grid-cols-${cols.xl}` ].filter(Boolean) : colsMap[cols]; return ( <Component className={cn( 'grid', colsClasses, gapMap[gap], alignMap[align], justifyMap[justify], className )} > {children} </Component> );
}
