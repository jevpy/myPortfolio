import { TextGenerateEffect } from './ui/text-generate-effect';
import type { Locale } from '../i18n/routes';
import { legacy } from '../i18n/legacy';

export function MainText({ locale = 'en' }: { locale?: Locale }) {
  return <TextGenerateEffect words={legacy[locale].mainText} />;
}
