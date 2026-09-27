"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  uniform float uTime;

  void main() {
    // diagonal sweep across the band
    float m = clamp((vUv.x + (1.0 - vUv.y)) * 0.5, 0.0, 1.0);

    vec3 deep  = vec3(0.02, 0.16, 0.62);
    vec3 mid   = vec3(0.00, 0.48, 0.95);
    vec3 light = vec3(0.35, 0.92, 1.00);

    vec3 col = mix(deep, mid, smoothstep(0.0, 0.60, m));
    col = mix(col, light, smoothstep(0.70, 1.0, m));

    // angular foil shimmer travelling around the band
    float ang = atan(vPos.y, vPos.x);
    float shimmer = 0.5 + 0.5 * sin(ang * 3.0 - uTime * 0.7);
    col += vec3(0.06, 0.12, 0.16) * shimmer * 0.5;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * The iridescent foil band that rings the coin face.
 *
 * This is deliberately an annulus, not a full plane: a full-bleed plane paints
 * the entire face blue, and because a metal tints its reflections by its own
 * albedo, that makes the coin permanently blue and impossible to read as metal.
 * Keeping the foil to a band lets the field stay silver.
 */
export function IridescentPlane() {
  const material = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (material.current) {
      material.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, -0.6]}>
      <ringGeometry args={[1.28, 1.58, 96, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={{ uTime: { value: 0 } }}
        depthWrite={false}
      />
    </mesh>
  );
}
