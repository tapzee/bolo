"use client";

import { TextParticle } from "@/components/ui/text-particle";

const settings = {
  text: "Bolo AI",
  particleDensity: 4,
  particleSize: 2,
  particleColor: "#f97316",
  fontSize: 140,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return (
    <div className="h-[400px] w-full flex items-center justify-center bg-card/40 rounded-3xl border border-border/80 p-4">
      <TextParticle
        text={s.text}
        particleDensity={s.particleDensity}
        particleSize={s.particleSize}
        particleColor={s.particleColor}
        fontSize={s.fontSize}
      />
    </div>
  );
}
