"use client";

import { RenderTexture, Text } from "@react-three/drei";
import { IridescentPlane } from "./IridescentPlane";
import type { Archetype } from "@/lib/archetypes";

const MONO_FONT = "/fonts/JetBrainsMono-Variable.ttf";

/**
 * The virtual scene inside each RenderTexture is framed by a perspective camera
 * at z=5 with fov 45, so roughly -2.07..2.07 is visible. The coin cap maps the
 * full texture square onto a circle of radius 2. Anything beyond radius ~1.9 is
 * off-frame, which is why the old 3.1-radius ring never appeared.
 */
interface Palette {
  main: string;
  accent: string;
  dim: string;
  gem: string;
  ring: string;
}

/** Brushed silver field with deep cobalt enamel inlay and a cyan gem. */
const FOIL: Palette = {
  main: "#FFFFFF",
  accent: "#08194A",
  dim: "#152449",
  gem: "#00E5FF",
  ring: "#F2F6FA",
};

/** Albedo is ignored for the bump pass; only the silhouette matters. */
const ENGRAVED: Palette = {
  main: "#000000",
  accent: "#000000",
  dim: "#000000",
  gem: "#000000",
  ring: "#000000",
};

const RING_RADIUS = 1.7;

function FrontArt({
  archetype,
  palette,
}: {
  archetype: Archetype;
  palette: Palette;
}) {
  return (
    <>
      {palette === FOIL && <IridescentPlane />}

      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.012, 8, 96]} />
        <meshBasicMaterial color={palette.ring} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.15, 0]} scale={[0.17, 0.17, 0.05]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={palette.gem} toneMapped={false} />
      </mesh>

      <Text
        position={[0, 0.55, 0]}
        fontSize={0.13}
        letterSpacing={0.16}
        color={palette.accent}
        font={MONO_FONT}
      >
        THE INSTINCT SERIES
      </Text>

      <Text
        position={[0, 0, 0]}
        fontSize={0.46}
        letterSpacing={0.04}
        color={palette.main}
        font={MONO_FONT}
        maxWidth={3}
        textAlign="center"
      >
        {archetype.label.toUpperCase()}
      </Text>

      <Text
        position={[0, -0.62, 0]}
        fontSize={0.14}
        letterSpacing={0.14}
        color={palette.dim}
        font={MONO_FONT}
      >
        {archetype.number.toUpperCase()}
      </Text>
    </>
  );
}

function BackArt({
  companyName,
  palette,
  mirrored,
}: {
  companyName: string;
  palette: Palette;
  mirrored: boolean;
}) {
  return (
    <group rotation={mirrored ? [0, Math.PI, 0] : [0, 0, 0]}>
      {palette === FOIL && <IridescentPlane />}

      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.012, 8, 96]} />
        <meshBasicMaterial color={palette.ring} toneMapped={false} />
      </mesh>

      <Text
        position={[0, 0.35, 0]}
        fontSize={0.26}
        color={palette.main}
        font={MONO_FONT}
        maxWidth={2.9}
        textAlign="center"
      >
        {companyName || "YOUR COMPANY"}
      </Text>

      <mesh position={[0, -0.02, 0]}>
        <planeGeometry args={[2.4, 0.018]} />
        <meshBasicMaterial color={palette.accent} toneMapped={false} />
      </mesh>

      <Text
        position={[0, -0.32, 0]}
        fontSize={0.3}
        letterSpacing={0.18}
        color={palette.accent}
        font={MONO_FONT}
      >
        EGOMONK
      </Text>

      <Text
        position={[0, -0.66, 0]}
        fontSize={0.085}
        letterSpacing={0.08}
        color={palette.dim}
        font={MONO_FONT}
      >
        MINED BY INTELLIGENCE · ATTENTION · CULTURE
      </Text>
    </group>
  );
}

export function FrontFaceMaterial({ archetype }: { archetype: Archetype }) {
  return (
    <meshPhysicalMaterial
      attach="material-1"
      color="#ffffff"
      metalness={1}
      roughness={0.22}
      bumpScale={-0.02}
      envMapIntensity={1.6}
      iridescence={0.18}
      iridescenceIOR={1.6}
      iridescenceThicknessRange={[120, 480]}
      clearcoat={0.35}
      clearcoatRoughness={0.25}
    >
      <RenderTexture attach="map" width={1024} height={1024} anisotropy={16}>
        <color attach="background" args={["#A6ACB4"]} />
        <FrontArt archetype={archetype} palette={FOIL} />
      </RenderTexture>
      <RenderTexture attach="bumpMap" width={1024} height={1024} anisotropy={16}>
        <color attach="background" args={["#ffffff"]} />
        <FrontArt archetype={archetype} palette={ENGRAVED} />
      </RenderTexture>
    </meshPhysicalMaterial>
  );
}

export function BackFaceMaterial({ companyName }: { companyName: string }) {
  return (
    <meshPhysicalMaterial
      attach="material-2"
      color="#ffffff"
      metalness={1}
      roughness={0.26}
      bumpScale={-0.02}
      envMapIntensity={1.5}
      iridescence={0.15}
      iridescenceIOR={1.6}
      iridescenceThicknessRange={[120, 480]}
      clearcoat={0.3}
      clearcoatRoughness={0.3}
    >
      <RenderTexture attach="map" width={1024} height={1024} anisotropy={16}>
        <color attach="background" args={["#A6ACB4"]} />
        <BackArt companyName={companyName} palette={FOIL} mirrored />
      </RenderTexture>
      <RenderTexture attach="bumpMap" width={1024} height={1024} anisotropy={16}>
        <color attach="background" args={["#ffffff"]} />
        <BackArt companyName={companyName} palette={ENGRAVED} mirrored />
      </RenderTexture>
    </meshPhysicalMaterial>
  );
}
