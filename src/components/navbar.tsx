import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconFileCode,
  IconHome,
  IconNewSection,
  IconRocket,
  IconTerminal2,
  IconTool,
} from "@tabler/icons-react";
import { Image } from "astro:assets";
import { FloatingDock } from "./ui/floating-dock";

export function Navbar() {
  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-300" />
      ),
      href: "/",
    },

    {
      title: "Code Tools",
      icon: (
        <IconRocket className="h-full w-full text-neutral-300" />
      ),
      href: "/code-tools",
    },
    {
      title: "Tools",
      icon: (
        <IconTool className="h-full w-full text-neutral-300" />
      ),
      href: "/daily-tools",
    },

    {
      title: "Blog",
      icon: (
        <IconFileCode className="h-full w-full text-neutral-300" />
      ),
      href: "/blog",
    },

    // {
    //   title: "Twitter",
    //   icon: (
    //     <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "#",
    // },
    // {
    //   title: "GitHub",
    //   icon: (
    //     <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    //   ),
    //   href: "#",
    // },
  ];
  return (
    <div className="flex mb-2 items-center justify-center w-full">
      <FloatingDock
        // only for demo, remove for production
        items={links}
      />
    </div>
  );
}
