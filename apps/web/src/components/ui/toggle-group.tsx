import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const toggleGroupItemVariants = cva(
  "inline-flex h-8 flex-1 items-center justify-center rounded-md px-3 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-primary data-[pressed]:text-primary-foreground",
);

function ToggleGroup({
  className,
  onValueChange,
  type,
  value,
  ...props
}: Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive>,
  "multiple" | "onValueChange" | "value"
> & {
  onValueChange?: (value: string) => void;
  type?: "single" | "multiple";
  value?: string;
}) {
  return (
    <ToggleGroupPrimitive
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-lg border border-input bg-secondary p-1",
        className,
      )}
      data-slot="toggle-group"
      multiple={type === "multiple"}
      onValueChange={(nextValue) => onValueChange?.(nextValue[0] ?? "")}
      value={value ? [value] : []}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof Toggle> &
  VariantProps<typeof toggleGroupItemVariants>) {
  return (
    <Toggle
      className={cn(toggleGroupItemVariants(), className)}
      data-slot="toggle-group-item"
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
