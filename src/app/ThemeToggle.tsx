// src/app/ThemeToggle.tsx
"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("dark"); // fallback default

  const toggle = () => setColorScheme(computed === "dark" ? "light" : "dark");

  return (
    <Tooltip label={computed === "dark" ? "Switch to light" : "Switch to dark"}>
      <ActionIcon
        variant="subtle"
        aria-label="Toggle color scheme"
        onClick={toggle}
        size="lg"
      >
        {computed === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
