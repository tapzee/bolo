"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  color: string;
}

export interface TextParticleAnimationProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  particleSize?: number;
  particleColor?: string;
  particleDensity?: number;
  backgroundColor?: string;
  className?: string;
  radius?: number;
  forceMultiplier?: number;
  returnSpeed?: number;
}

export function TextParticle({
  text,
  fontSize = 80,
  fontFamily = "var(--font-instrument-serif), var(--font-playfair), serif",
  particleSize = 2,
  particleColor = "#f97316",
  particleDensity = 6,
  backgroundColor = "transparent",
  className = "",
  radius = 90,
  forceMultiplier = 4,
  returnSpeed = 0.08,
}: TextParticleAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [, setDimensions] = useState({ width: 0, height: 0 });
  const [mouse, setMouse] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const animationRef = useRef<number | null>(null);

  // Initialize canvas and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      setDimensions({ width: rect.width, height: rect.height });
      initText(rect.width, rect.height, dpr);
    };

    const initText = (w: number, h: number, dpr: number) => {
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);

      // Auto-scale fontSize based on canvas width
      const responsiveFontSize = Math.min(fontSize, w * 0.18);
      ctx.font = `italic ${responsiveFontSize}px ${fontFamily}`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const x = w / 2;
      const y = h / 2;

      ctx.fillText(text, x, y);

      const textCoordinates = ctx.getImageData(0, 0, w * dpr, h * dpr);
      const newParticles: Particle[] = [];
      const step = Math.max(2, Math.round(particleDensity * dpr));

      for (let py = 0; py < textCoordinates.height; py += step) {
        for (let px = 0; px < textCoordinates.width; px += step) {
          const index = (py * textCoordinates.width + px) * 4;
          const alpha = textCoordinates.data[index + 3];

          if (alpha && alpha > 120) {
            const posX = px / dpr;
            const posY = py / dpr;
            newParticles.push({
              x: posX + (Math.random() - 0.5) * 8,
              y: posY + (Math.random() - 0.5) * 8,
              size: particleSize,
              baseX: posX,
              baseY: posY,
              density: Math.random() * 25 + 5,
              color: particleColor,
            });
          }
        }
      }

      setParticles(newParticles);
      ctx.clearRect(0, 0, w, h);
    };

    const timer = setTimeout(handleResize, 100);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    text,
    fontSize,
    fontFamily,
    particleSize,
    particleColor,
    particleDensity,
  ]);

  // Animation loop
  useEffect(() => {
    if (particles.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      particles.forEach((particle) => {
        let dx = 0;
        let dy = 0;
        let distance = 0;
        let forceDirectionX = 0;
        let forceDirectionY = 0;

        if (mouse.x !== null && mouse.y !== null) {
          dx = mouse.x - particle.x;
          dy = mouse.y - particle.y;
          distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < radius) {
            const force = (radius - distance) / radius;
            forceDirectionX = (dx / distance) * force * forceMultiplier * (particle.density * 0.08);
            forceDirectionY = (dy / distance) * force * forceMultiplier * (particle.density * 0.08);
          }
        }

        const moveX = -forceDirectionX + (particle.baseX - particle.x) * returnSpeed;
        const moveY = -forceDirectionY + (particle.baseY - particle.y) * returnSpeed;

        particle.x += moveX;
        particle.y += moveY;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, mouse, backgroundColor, radius, forceMultiplier, returnSpeed]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMouse({ x: null, y: null });
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

export default TextParticle;
