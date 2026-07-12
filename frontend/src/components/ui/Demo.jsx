import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export function ThemeTogglePreview() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-muted-foreground text-sm">
        Click the toggle to switch between light and dark mode.
      </p>
      <ThemeToggle size="md" />
    </div>
  );
}

export default ThemeTogglePreview;
