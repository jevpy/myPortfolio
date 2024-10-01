import { TextGenerateEffect } from "./ui/text-generate-effect";

const words = `Thinking, Smiling and Coding
`;

export function MainText() {
  return <TextGenerateEffect words={words} />;
}
