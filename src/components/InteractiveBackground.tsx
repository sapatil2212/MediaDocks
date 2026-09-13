"use client";

import { useEffect, useRef } from "react";

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    // Mouse position with smooth damping
    const mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      isHovered: false,
    };

    // Ambient floating light orbs (luxurious atmospheric lighting)
    const orbs = [
      {
        x: width * 0.25,
        y: height * 0.25,
        baseX: 0.25,
        baseY: 0.25,
        radius: Math.min(width * 0.45, 380),
        colorDark: [139, 92, 246], // Violet
        colorLight: [99, 102, 241],
        alpha: 0.12,
        speed: 0.0006,
        phase: 0,
      },
      {
        x: width * 0.75,
        y: height * 0.3,
        baseX: 0.75,
        baseY: 0.3,
        radius: Math.min(width * 0.42, 340),
        colorDark: [59, 130, 246], // Indigo/Sky
        colorLight: [14, 165, 233],
        alpha: 0.1,
        speed: 0.0008,
        phase: Math.PI * 0.5,
      },
      {
        x: width * 0.5,
        y: height * 0.7,
        baseX: 0.5,
        baseY: 0.7,
        radius: Math.min(width * 0.38, 300),
        colorDark: [168, 85, 247], // Purple
        colorLight: [168, 85, 247],
        alpha: 0.08,
        speed: 0.0005,
        phase: Math.PI,
      },
    ];

    const isDark = () =>
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    const parentEl = canvas.parentElement;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.35;
    };

    if (parentEl) {
      parentEl.addEventListener("mousemove", handleMouseMove);
      parentEl.addEventListener("mouseleave", handleMouseLeave);
    }

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const dark = isDark();

      // Smooth mouse interpolation
      if (!prefersReducedMotion) {
        mouse.x += (mouse.targetX - mouse.x) * 0.06;
        mouse.y += (mouse.targetY - mouse.y) * 0.06;
      }

      // Draw ambient luxury light orbs
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        if (!prefersReducedMotion) {
          orb.phase += orb.speed;
          orb.x = width * orb.baseX + Math.sin(orb.phase) * (width * 0.06);
          orb.y = height * orb.baseY + Math.cos(orb.phase * 1.3) * (height * 0.06);
        }

        const rgb = dark ? orb.colorDark : orb.colorLight;
        const currentAlpha = dark ? orb.alpha : orb.alpha * 0.85;

        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius,
        );

        gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${currentAlpha})`);
        gradient.addColorStop(0.5, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${currentAlpha * 0.4})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Interactive Dynamic Cursor Spotlight
      if (mouse.isHovered || !prefersReducedMotion) {
        const spotRadius = Math.min(width * 0.35, 320);
        const spotGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          spotRadius,
        );

        if (dark) {
          spotGrad.addColorStop(0, "rgba(167, 139, 250, 0.12)");
          spotGrad.addColorStop(0.4, "rgba(99, 102, 241, 0.05)");
          spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          spotGrad.addColorStop(0, "rgba(99, 102, 241, 0.09)");
          spotGrad.addColorStop(0.4, "rgba(56, 189, 248, 0.04)");
          spotGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        }

        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (parentEl) {
        parentEl.removeEventListener("mousemove", handleMouseMove);
        parentEl.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}
