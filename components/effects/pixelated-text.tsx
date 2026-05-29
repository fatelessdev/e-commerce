"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;

  void main() {
    vec2 gridUv = floor(vUv * vec2(46.0, 32.0)) / vec2(46.0, 32.0);
    vec2 centerOfPixel = gridUv + vec2(1.0 / 46.0, 1.0 / 32.0);
    vec2 mouseDirection = uMouse - uPrevMouse;
    vec2 pixelToMouse = centerOfPixel - uMouse;
    float distanceToMouse = length(pixelToMouse);
    float strength = smoothstep(0.24, 0.0, distanceToMouse);
    vec2 uv = vUv - strength * mouseDirection * 0.42;
    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`;

type PixelatedTextProps = {
  text: string;
  className?: string;
  textClassName?: string;
  align?: "center" | "left";
};

function createTextTexture(text: string, width: number, height: number, align: "center" | "left") {
  const canvas = document.createElement("canvas");
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  const rootStyles = getComputedStyle(document.body);
  const fontFamily = rootStyles.getPropertyValue("--font-instrument-serif").trim() || "Georgia, serif";
  context.fillStyle = rootStyles.getPropertyValue("--foreground").trim() || rootStyles.color || "#f4f1ec";
  context.textAlign = align;
  context.textBaseline = "middle";
  context.font = `400 ${Math.floor(canvas.height * 0.82)}px ${fontFamily}, Georgia, serif`;
  context.letterSpacing = "0px";

  const measured = context.measureText(text);
  const maxWidth = canvas.width * 0.98;
  const ratio = measured.width > maxWidth ? maxWidth / measured.width : 1;

  context.save();
  context.translate(align === "left" ? canvas.width * 0.01 : canvas.width / 2, canvas.height / 2);
  context.scale(ratio, 1);
  context.fillText(text, 0, 0);
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function PixelatedText({ text, className, textClassName, align = "center" }: PixelatedTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion((version) => version + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (shouldReduceMotion || !rootRef.current || !canvasRef.current) return;

    const root = rootRef.current;
    const canvas = canvasRef.current;
    let active = true;
    let frameId = 0;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.OrthographicCamera | null = null;
    let mesh: THREE.Mesh | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let texture: THREE.CanvasTexture | null = null;

    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    let onPointerLeave: (() => void) | null = null;
    let onResize: (() => void) | null = null;

    document.fonts.ready.then(() => {
      if (!active || !root || !canvas) return;

      const rect = root.getBoundingClientRect();
      if (rect.width < 320 || rect.height < 120) return;

      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        });
      } catch {
        return;
      }

      scene = new THREE.Scene();
      const aspect = rect.width / rect.height;
      camera = new THREE.OrthographicCamera(-1, 1, 1 / aspect, -1 / aspect, 0.1, 10);
      camera.position.z = 1;

      const initialTexture = createTextTexture(text, rect.width, rect.height, align);
      if (!initialTexture) return;
      texture = initialTexture;

      const uniforms = {
        uTexture: { value: texture },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
      };

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
      });
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2 / aspect), material);
      scene.add(mesh);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(rect.width, rect.height, false);
      renderer.setClearColor(0x000000, 0);

      const mouse = { x: 0.5, y: 0.5 };
      const target = { x: 0.5, y: 0.5 };
      let prev = { x: 0.5, y: 0.5 };
      let ease = 0.025;

      const render = () => {
        if (!active || !renderer || !scene || !camera) return;
        mouse.x += (target.x - mouse.x) * ease;
        mouse.y += (target.y - mouse.y) * ease;
        uniforms.uMouse.value.set(mouse.x, 1 - mouse.y);
        uniforms.uPrevMouse.value.set(prev.x, 1 - prev.y);
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(render);
      };

      onPointerMove = (event: PointerEvent) => {
        const bounds = root.getBoundingClientRect();
        prev = { ...target };
        target.x = (event.clientX - bounds.left) / bounds.width;
        target.y = (event.clientY - bounds.top) / bounds.height;
        ease = 0.04;
      };

      onPointerLeave = () => {
        ease = 0.012;
        target.x = prev.x;
        target.y = prev.y;
      };

      onResize = () => {
        if (!camera || !mesh || !renderer || !uniforms) return;
        const nextRect = root.getBoundingClientRect();
        const nextAspect = nextRect.width / nextRect.height;
        camera.top = 1 / nextAspect;
        camera.bottom = -1 / nextAspect;
        camera.updateProjectionMatrix();
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(2, 2 / nextAspect);
        renderer.setSize(nextRect.width, nextRect.height, false);
        if (texture) {
          texture.dispose();
        }
        const nextTexture = createTextTexture(text, nextRect.width, nextRect.height, align);
        if (nextTexture) {
          texture = nextTexture;
          uniforms.uTexture.value = texture;
        }
      };

      root.addEventListener("pointermove", onPointerMove);
      root.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("resize", onResize);
      setReady(true);
      render();
    });

    return () => {
      active = false;
      if (frameId) window.cancelAnimationFrame(frameId);

      if (onPointerMove) root.removeEventListener("pointermove", onPointerMove);
      if (onPointerLeave) root.removeEventListener("pointerleave", onPointerLeave);
      if (onResize) window.removeEventListener("resize", onResize);

      if (texture) texture.dispose();
      if (material) material.dispose();
      if (mesh) mesh.geometry.dispose();
      if (renderer) renderer.dispose();
      setReady(false);
    };
  }, [align, shouldReduceMotion, text, themeVersion]);

  return (
    <div ref={rootRef} className={cn("relative w-full overflow-hidden", className)}>
      <span
        className={cn(
          "block select-none font-serif text-[31vw] font-normal uppercase leading-[0.72] tracking-normal text-current",
          align === "left" ? "text-left" : "text-center",
          ready && !shouldReduceMotion ? "opacity-0" : "opacity-100",
          textClassName,
        )}
      >
        {text}
      </span>
      {!shouldReduceMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
