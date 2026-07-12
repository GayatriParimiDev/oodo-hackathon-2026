import React, { useEffect, useState } from "react";
import { Moon } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function ThemeSunIcon({ className, size }) {
  return (
    <svg
      aria-hidden
      className={cn("block shrink-0", className)}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" fill="currentColor" r="3.25" />
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="2">
        <path d="M12 2.5v2.5" />
        <path d="M12 19v2.5" />
        <path d="M4.22 4.22l1.77 1.77" />
        <path d="M18.01 18.01l1.77 1.77" />
        <path d="M2.5 12h2.5" />
        <path d="M19 12h2.5" />
        <path d="M4.22 19.78l1.77-1.77" />
        <path d="M18.01 5.99l1.77-1.77" />
      </g>
    </svg>
  );
}

const sizeConfig = {
  sm: {
    track: "h-6 w-11",
    knob: "h-4 w-4",
    knobOffset: "left-[calc(100%-1.125rem)]",
    knobStart: "left-0.5",
    icon: 12,
    sunIcon: 12,
  },
  md: {
    track: "h-8 w-14",
    knob: "h-6 w-6",
    knobOffset: "left-[calc(100%-1.625rem)]",
    knobStart: "left-0.5",
    icon: 16,
    sunIcon: 16,
  },
  lg: {
    track: "h-10 w-[4.5rem]",
    knob: "h-8 w-8",
    knobOffset: "left-[calc(100%-2.125rem)]",
    knobStart: "left-0.5",
    icon: 20,
    sunIcon: 20,
  },
};

export function ThemeToggle({ className, size = "md" }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const config = sizeConfig[size];

  useEffect(() => {
    setMounted(true);
    // By default, the theme is light mode.
    // Read theme from localStorage or default to light.
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = savedTheme === "dark";
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={cn(
          "relative rounded-full border-2 border-border bg-muted",
          config.track,
          className
        )}
        type="button"
      />
    );
  }

  return (
    <button
      aria-label="Toggle theme"
      className={cn(
        "relative cursor-pointer rounded-full border-2 transition-colors duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
        config.track,
        isDark
          ? "border-[#2d2a4e] bg-[#1a1838]"
          : "border-[#e8d5b7] bg-[#fef3c7]",
        className
      )}
      onClick={toggle}
      type="button"
    >
      <div
        className={cn(
          "absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full transition-[left,background-color] duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
          config.knob,
          isDark ? config.knobOffset : config.knobStart,
          isDark ? "bg-[#e8e6f0] text-[#1a1838]" : "bg-[#ff9500] text-white"
        )}
      >
        <ThemeSunIcon
          className={cn(
            "col-start-1 row-start-1 origin-center transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
            isDark
              ? "rotate-90 scale-50 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
          size={config.sunIcon}
        />
        <Moon
          className={cn(
            "col-start-1 row-start-1 block shrink-0 origin-center transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-50 opacity-0"
          )}
          size={config.icon}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}

export default ThemeToggle;
