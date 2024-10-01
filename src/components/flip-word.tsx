import { FlipWords } from "./ui/flip-words";

export function FlipWord() {
  const words = [
    "Expert in writing clean, efficient code",
    "Passionate about delivering high-quality, effective code",
    "Built scalable solutions that grow with client demands",
    "Delivered well-structured code that ensures client satisfaction and performance",
  ];

  return (
    <div className="flex justify-center items-center px-4">
      <div className="text-2xl md:text-4xl mx-auto font-normal text-neutral-600 dark:text-neutral-400">
        <FlipWords words={words} /> <br />
      </div>
    </div>
  );
}
