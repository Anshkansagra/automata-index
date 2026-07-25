"use client";

import { useEffect, useState } from "react";
import {
  RoboticsArm,
  NeuralNetwork,
  AutonomousVehicle,
  DigitalTwin,
  WirelessSatellite,
  HumanMachineCollab,
} from "@/components/illustrations";

const SLIDES = [
  {
    tag: "Robotics",
    headline: "Indexing the Future of Automata & Machine Intelligence",
    sub: "Free, open-access research on manipulation, locomotion, and embodied AI.",
    Visual: RoboticsArm,
  },
  {
    tag: "Deep Learning",
    headline: "Every Neural Architecture, One Search Away",
    sub: "From transformers to diffusion models — no paywalls, ever.",
    Visual: NeuralNetwork,
  },
  {
    tag: "Autonomous Vehicles",
    headline: "Charting the Research Behind Self-Driving Systems",
    sub: "Perception, planning, and control papers from arXiv, MDPI, and IEEE.",
    Visual: AutonomousVehicle,
  },
  {
    tag: "Digital Twins",
    headline: "Bridging Simulation and the Physical World",
    sub: "Open research on digital twins, simulation, and systems engineering.",
    Visual: DigitalTwin,
  },
  {
    tag: "Wireless & Satellite Nav",
    headline: "Connecting Every Signal in the Research Stack",
    sub: "Wireless communication, 5G/6G, and satellite navigation research.",
    Visual: WirelessSatellite,
  },
  {
    tag: "Human-Machine Collaboration",
    headline: "Where Human Intent Meets Machine Precision",
    sub: "HRI, shared autonomy, and collaborative systems research.",
    Visual: HumanMachineCollab,
  },
];

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];
  const Visual = slide.Visual;

  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-20 sm:px-8 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-block rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium uppercase tracking-widest text-zinc-400">
            {slide.tag}
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {slide.headline}
          </h1>
          <p className="mt-4 max-w-md text-zinc-400">{slide.sub}</p>

          <div className="mt-6 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-4 bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="h-64 text-blue-400 opacity-80 md:h-80">
          <Visual />
        </div>
      </div>
    </section>
  );
}
