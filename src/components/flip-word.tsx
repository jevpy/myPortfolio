import { FlipWords } from "./ui/flip-words";

import type { Locale } from '../i18n/routes';
import { legacy } from '../i18n/legacy';

export function FlipWord({ locale = 'en' }: { locale?: Locale }) {
  const words = legacy[locale].phrases;

  return (
    <div className="flex justify-center items-center px-4">
      <div className="text-2xl md:text-4xl mx-auto font-normal text-neutral-600 dark:text-neutral-400">
        <FlipWords words={words} /> <br />
      </div>
    </div>
  );
}
