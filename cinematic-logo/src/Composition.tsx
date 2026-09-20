import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Interactive,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  schoolName: string;
};

const LOGO_WIDTH = 820;
const LOGO_HEIGHT = 852;
const LOGO_TOP = 106;

const LogoImage: React.FC<{
  name: string;
  opacity: number;
  clipPath?: string;
  filter?: string;
  scale?: number;
}> = ({name, opacity, clipPath, filter, scale = 1}) => {
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: "50%",
        top: LOGO_TOP,
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT,
        translate: "-50% 0px",
        opacity,
        clipPath,
        filter,
        scale,
      }}
    >
      <Img
        src={staticFile("logo-reference.png")}
        style={{width: "100%", height: "100%", objectFit: "fill"}}
      />
    </Interactive.Div>
  );
};

const GoldParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {Array.from({length: 92}).map((_, index) => {
        const angle = (index * 137.508 * Math.PI) / 180;
        const radius = 250 + (index % 12) * 31;
        const startX = width / 2 + Math.cos(angle) * radius;
        const startY = 350 + Math.sin(angle) * radius * 0.56;
        const targetX = width / 2 + Math.cos(angle * 1.8) * (72 + (index % 7) * 13);
        const targetY = 350 + Math.sin(angle * 2.1) * (66 + (index % 5) * 12);
        const delay = 4 + (index % 18);
        const size = 3.5 + (index % 5) * 1.55;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: interpolate(frame, [delay, 58 + (index % 12)], [startX, targetX], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              top: interpolate(frame, [delay, 58 + (index % 12)], [startY, targetY], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              width: size,
              height: size,
              borderRadius: index % 4 === 0 ? "2px" : "50%",
              rotate: index % 4 === 0 ? "45deg" : "0deg",
              opacity: interpolate(
                frame,
                [delay, delay + 7, 48 + (index % 15), 76 + (index % 8)],
                [0, 1, 0.82, 0],
                {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
              ),
              scale: interpolate(frame, [delay, delay + 8, 70], [0.15, 1, 0.3], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              background:
                index % 3 === 0
                  ? "#fff3a6"
                  : index % 3 === 1
                    ? "#f1b92e"
                    : "#ca8610",
              boxShadow: `0 0 ${12 + (index % 5) * 5}px rgba(230, 170, 37, 0.95)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const DomeTrace: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Dome drawing light"
      style={{
        position: "absolute",
        left: "50%",
        top: LOGO_TOP,
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT,
        translate: "-50% 0px",
        opacity: interpolate(frame, [42, 54, 102, 118], [0, 1, 0.8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <svg viewBox="0 0 820 852" width="100%" height="100%">
        <defs>
          <linearGradient id="traceGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff6c4" />
            <stop offset="0.42" stopColor="#e5ac35" />
            <stop offset="1" stopColor="#1ac6b5" />
          </linearGradient>
          <filter id="traceGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fill="none" stroke="url(#traceGold)" strokeLinecap="round" filter="url(#traceGlow)">
          <path
            d="M154 515 L154 357 C154 206 261 95 410 35 C559 95 666 206 666 357 L666 515"
            strokeWidth="8"
            style={{
              strokeDasharray: 1500,
              strokeDashoffset: interpolate(frame, [46, 102], [1500, 0], {
                easing: Easing.bezier(0.65, 0, 0.35, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
          <path
            d="M154 342 L410 520 L666 342"
            strokeWidth="8"
            style={{
              strokeDasharray: 680,
              strokeDashoffset: interpolate(frame, [70, 112], [680, 0], {
                easing: Easing.bezier(0.65, 0, 0.35, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        </g>
      </svg>
    </Interactive.Div>
  );
};

export const CinematicLogo: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 43%, #ffffff 0%, #ffffff 72%, #f7f8f7 100%)",
        overflow: "hidden",
      }}
    >
      <Audio
        src={staticFile("opening-sfx.wav")}
        volume={(audioFrame) =>
          interpolate(audioFrame, [0, 12, 188, 209], [0, 0.92, 0.92, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Sequence from={156}>
        <Audio src={staticFile("whoosh.wav")} volume={0.44} playbackRate={0.78} />
      </Sequence>

      <GoldParticles />

      <LogoImage
        name="Exact central emblem"
        opacity={interpolate(frame, [18, 48], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        scale={interpolate(frame, [18, 52], [0.88, 1], {
          easing: Easing.spring({damping: 18, stiffness: 92}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        })}
        clipPath={`inset(${interpolate(frame, [18, 52], [23, 14.5], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% ${interpolate(frame, [18, 52], [47, 31], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% ${interpolate(frame, [18, 52], [70, 56], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% ${interpolate(frame, [18, 52], [47, 31], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%)`}
        filter="drop-shadow(0 12px 24px rgba(0,83,70,0.12))"
      />

      <DomeTrace />

      <LogoImage
        name="Exact turquoise dome"
        opacity={interpolate(frame, [56, 108], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        clipPath={`inset(0 ${interpolate(frame, [55, 112], [49, 8], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% 39% ${interpolate(frame, [55, 112], [49, 8], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%)`}
      />

      <LogoImage
        name="Exact Arabic calligraphy"
        opacity={interpolate(frame, [102, 138], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        clipPath={`inset(60% ${interpolate(frame, [100, 148], [50, 7], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% 9% ${interpolate(frame, [100, 148], [50, 7], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%)`}
        filter="drop-shadow(0 13px 20px rgba(0,30,72,0.12))"
      />

      <LogoImage
        name="Exact school name plaque"
        opacity={interpolate(frame, [132, 160], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        scale={interpolate(frame, [132, 162], [0.96, 1], {
          easing: Easing.spring({damping: 22, stiffness: 110}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        })}
        clipPath="inset(88% 10% 0 10%)"
      />

      <LogoImage
        name="Exact complete original logo"
        opacity={interpolate(frame, [150, 166], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />

      <Interactive.Div
        name="Premium golden light sweep"
        style={{
          position: "absolute",
          left: interpolate(frame, [158, 202], [380, 1440], {
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          top: 18,
          width: 190,
          height: 1040,
          rotate: "13deg",
          opacity: interpolate(frame, [154, 164, 192, 205], [0, 0.58, 0.44, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          background:
            "linear-gradient(90deg, transparent 0%, rgba(225,165,35,0.04) 18%, rgba(255,238,178,0.72) 50%, rgba(225,165,35,0.05) 82%, transparent 100%)",
          filter: "blur(14px)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="AnNajah-Cinematic-Logo"
      component={CinematicLogo}
      durationInFrames={210}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{schoolName: "Pondok Pesantren An-Najah Batam"}}
    />
  );
};
