"use client";

import type { RefObject } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    vec3 n = normalize(vNormal);
    float ay = abs(n.y);
    float ax = abs(n.x);
    float az = abs(n.z);

    vec2 uv2;
    if (ay >= ax && ay >= az) uv2 = vPos.xz;
    else if (ax >= az) uv2 = vPos.yz;
    else uv2 = vPos.xy;

    vec2 g = fract(uv2 * 5.0);
    float d = distance(g, vec2(0.5));
    float dot = smoothstep(0.46, 0.14, d);

    float sweep = 0.35 + 0.65 * smoothstep(0.0, 0.1, sin(vPos.y * 14.0 - uTime * 5.0) + 0.45);
    float pulse = 0.75 + 0.25 * sin(uTime * 2.4);

    vec3 col = mix(vec3(0.0, 0.27, 1.0), vec3(0.0, 0.9, 1.0), clamp(uv2.x * 0.5 + 0.5, 0.0, 1.0));

    float alpha = (0.2 + 0.8 * dot) * sweep * uOpacity * pulse;
    gl_FragColor = vec4(col * (0.3 + 1.4 * dot) * pulse, alpha);
  }
`;

interface HologramCoinProps {
  materialRef: RefObject<THREE.ShaderMaterial | null>;
  meshRef: RefObject<THREE.Mesh | null>;
}

export function HologramCoin({ materialRef, meshRef }: HologramCoinProps) {
  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[2, 2, 0.15, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}