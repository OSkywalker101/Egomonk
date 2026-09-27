"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { ArchetypeKey } from "@/lib/archetypes";
import { HologramCoin } from "./HologramCoin";
import { MetalCoin } from "./MetalCoin";

const REVEAL_DELAY = 1.6;
const REVEAL_DURATION = 1.8;

function CoinRig({
  archetype,
  companyName,
  onMetalRevealed,
}: {
  archetype: ArchetypeKey;
  companyName: string;
  onMetalRevealed?: () => void;
}) {
  const holGroup = useRef<THREE.Group>(null);
  const holMesh = useRef<THREE.Mesh>(null);
  const holMat = useRef<THREE.ShaderMaterial>(null);
  const metalGroup = useRef<THREE.Group>(null);
  const state = useRef({ progress: 0, revealAt: Infinity });
  const revealed = useRef(false);

  useFrame((root) => {
    const t = root.clock.elapsedTime;
    const pointer = root.pointer;

    if (state.current.revealAt === Infinity) {
      state.current.revealAt = t + REVEAL_DELAY;
    }
    const elapsed = t - state.current.revealAt;
    const p = THREE.MathUtils.clamp(
      THREE.MathUtils.smoothstep(elapsed, 0, REVEAL_DURATION),
      0,
      1
    );
    const eased = p >= 1 ? 1 : 1 - Math.pow(1 - p, 3);
    state.current.progress = eased;

    // The transition has run its course and the metal coin is fully in place,
    // so the poster can step aside. Keyed off the transition rather than first
    // paint on purpose: the canvas is live within a frame or two, and handing
    // over that early would flash the poster and hide the reveal.
    if (eased >= 1 && !revealed.current) {
      revealed.current = true;
      onMetalRevealed?.();
    }

    if (holMat.current) {
      holMat.current.uniforms.uTime.value = t;
      holMat.current.uniforms.uOpacity.value = 1 - eased;
    }

    if (holMesh.current) {
      holMesh.current.rotation.y =
        t * (0.5 + 6 * (1 - eased));
    }

    if (holGroup.current) {
      holGroup.current.position.y = Math.sin(t * 1.6) * 0.05 * (1 - eased);
      holGroup.current.scale.setScalar(1 + 0.04 * (1 - eased));
      holGroup.current.visible = eased < 1;
    }

    if (metalGroup.current) {
      metalGroup.current.visible = eased > 0.02;
      metalGroup.current.scale.setScalar(0.88 + 0.12 * eased);
      metalGroup.current.rotation.y = t * 0.35;
      metalGroup.current.rotation.x = 0.25 + pointer.y * 0.22;
      metalGroup.current.rotation.z = pointer.x * 0.18;
    }
  });

  return (
    <>
      <group ref={holGroup}>
        <HologramCoin materialRef={holMat} meshRef={holMesh} />
      </group>
      <MetalCoin groupRef={metalGroup} archetype={archetype} companyName={companyName} />
    </>
  );
}

/**
 * Signals that the metal coin has finished fading in, which is the moment the
 * poster hands over. If the canvas never starts, this never fires and the
 * poster simply stays put, which is the right failure mode.
 */
export function CoinCanvas({
  archetype,
  companyName,
  onMetalRevealed,
}: {
  archetype: ArchetypeKey;
  companyName: string;
  onMetalRevealed?: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 2.4, 5.4], fov: 42 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{ background: "transparent" }}
    >
      {/*
        The environment map does the work for the metal. These analytic lights
        only add crisp specular glints, so they stay low.
      */}
      <ambientLight intensity={0.2} />
      <hemisphereLight intensity={0.25} color="#ffffff" groundColor="#5a5f66" />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      {/* Accents only. A strong blue here tints the whole metal, because a
          metal's specular is F0 = albedo, so the light colour is the colour. */}
      <pointLight position={[-6, -2, 4]} intensity={6} color="#2a5cff" />
      <pointLight position={[6, 3, -4]} intensity={6} color="#00E5FF" />
      <pointLight position={[0, 6, 2]} intensity={22} color="#ffffff" />

      {/*
        Metals have no diffuse term. Everything a metal shows is a reflection of
        its surroundings, so the environment map IS the lighting rig. The base
        colour has to be a bright studio grey: a dark room simply reflects dark,
        no matter how many highlight strips you add. Built procedurally from
        Lightformers so there is no HDR download and it works fully offline.
      */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#ccd2d9"]} />

        {/* broad soft key across the coin face */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#ffffff"
          position={[0, 3.5, 4]}
          rotation={[-0.5, 0, 0]}
          scale={[9, 4, 1]}
        />
        {/* opposing strips: these draw the bright specular line along the rim */}
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#ffffff"
          position={[-5, 0.5, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[7, 0.7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#ffffff"
          position={[5, -0.5, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[7, 0.7, 1]}
        />
        {/* cool rim separation from behind */}
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#9fd8ff"
          position={[0, 0, -5]}
          scale={[6, 6, 1]}
        />
        {/* warm bounce from below so the underside is not dead */}
        <Lightformer
          form="circle"
          intensity={1.1}
          color="#b9c4d2"
          position={[0, -4, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={7}
        />
        {/* narrow dark band gives the face a value gradient instead of a flat wash */}
        <Lightformer
          form="rect"
          intensity={0.15}
          color="#5d6a7a"
          position={[0, -1.2, 5]}
          scale={[10, 1.6, 1]}
        />
      </Environment>

      <CoinRig archetype={archetype} companyName={companyName} onMetalRevealed={onMetalRevealed} />

      <ContactShadows
        position={[0, -2.35, 0]}
        opacity={0.55}
        scale={9}
        blur={2.6}
        far={4}
        resolution={512}
        color="#000000"
      />
    </Canvas>
  );
}