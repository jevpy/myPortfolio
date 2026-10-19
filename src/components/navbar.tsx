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

import { localizedPath, type Locale } from '../i18n/routes';
import { legacy } from '../i18n/legacy';

export function Navbar({ locale = 'en' }: { locale?: Locale }) {
  const t = legacy[locale];
  const links = [
    {
      title: t.home,
      icon: (
        <IconHome className="h-full w-full text-neutral-300" />
      ),
      href: "/",
    },

    {
      title: t.codeTools,
      icon: (
        <IconRocket className="h-full w-full text-neutral-300" />
      ),
      href: "/code-tools",
    },
    {
      title: t.tools,
      icon: (
        <IconTool className="h-full w-full text-neutral-300" />
      ),
      href: "/daily-tools",
    },

    {
      title: t.blog,
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
    <nav aria-label={t.navigation} className="flex mb-2 items-center justify-center w-full">
      <FloatingDock
        // only for demo, remove for production
        locale={locale}
        items={links.map((link) => ({ ...link, href: localizedPath(link.href, locale) }))}
      />
    </nav>
  );
}
