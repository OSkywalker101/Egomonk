"use client";

import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import type { ArchetypeKey } from "@/lib/archetypes";
import { ARCHETYPES } from "@/lib/archetypes";
import { FrontFaceMaterial } from "./CoinFaces";
import { BackFaceMaterial } from "./CoinFaces";

interface MetalCoinProps {
  archetype: ArchetypeKey;
  companyName: string;
  groupRef: RefObject<THREE.Group | null>;
}

const REED_COUNT = 120;
const REED_RADIUS = 2.004;
const COIN_HEIGHT = 0.15;

/**
 * Milled ("reeded") edge, the way a struck coin is finished. A plain cylinder
 * side reads as a smooth machined puck; the parallel grooves are what make the
 * silhouette legible while the coin spins.
 */
function ReededEdge() {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < REED_COUNT; i += 1) {
      const angle = (i / REED_COUNT) * Math.PI * 2;
      position.set(Math.cos(angle) * REED_RADIUS, 0, Math.sin(angle) * REED_RADIUS);
      // +90deg puts the box width on the tangent and its depth on the radius.
      euler.set(0, angle + Math.PI / 2, 0);
      quaternion.setFromEuler(euler);
      matrix.compose(position, quaternion, scale);
      instanced.setMatrixAt(i, matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, REED_COUNT]}>
      <boxGeometry args={[0.055, COIN_HEIGHT * 0.88, 0.032]} />
      <meshStandardMaterial
        color="#c9ced4"
        metalness={1}
        roughness={0.3}
        envMapIntensity={1.5}
      />
    </instancedMesh>
  );
}

export function MetalCoin({ archetype, companyName, groupRef }: MetalCoinProps) {
  const data = ARCHETYPES[archetype];

  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <cylinderGeometry args={[2, 2, COIN_HEIGHT, 64]} />
        <meshStandardMaterial
          attach="material-0"
          color="#b9c0c7"
          metalness={1}
          roughness={0.28}
          envMapIntensity={1.5}
        />
        <FrontFaceMaterial archetype={data} />
        <BackFaceMaterial companyName={companyName} />
        <Edges scale={1.001} color="#00E5FF" threshold={30} />
      </mesh>
      <ReededEdge />
    </group>
  );
}
