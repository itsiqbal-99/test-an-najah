import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Interactive,
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
  translateY?: number;
  rotate?: number;
}> = ({name, opacity, clipPath, filter, scale = 1, translateY = 0, rotate = 0}) => {
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: "50%",
        top: LOGO_TOP,
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT,
        translate: `-50% ${translateY}px`,
        rotate: `${rotate}deg`,
        opacity,
        clipPath,
        filter,
        scale,
        transformOrigin: "50% 42%",
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

const RadiantBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <Interactive.Div
        name="Soft radiant sunburst"
        style={{
          position: "absolute",
          left: "50%",
          top: "43%",
          width: 1320,
          height: 1320,
          translate: "-50% -50%",
          rotate: interpolate(frame, [0, 209], ["-7deg", "7deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          opacity: interpolate(frame, [0, 34, 150, 209], [0, 0.16, 0.1, 0.04], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          borderRadius: "50%",
          background:
            "repeating-conic-gradient(from 0deg, rgba(8,137,120,0.18) 0deg 2deg, transparent 2deg 18deg, rgba(224,170,54,0.13) 18deg 20deg, transparent 20deg 36deg)",
          maskImage: "radial-gradient(circle, black 0%, rgba(0,0,0,0.65) 34%, transparent 70%)",
        }}
      />
      <Interactive.Div
        name="Warm logo aura"
        style={{
          position: "absolute",
          left: "50%",
          top: 444,
          width: 920,
          height: 680,
          translate: "-50% -50%",
          borderRadius: "50%",
          scale: interpolate(frame, [0, 70, 155, 180, 209], [0.7, 1, 1, 1.08, 1.03], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0, 42, 150, 180, 209], [0, 0.28, 0.2, 0.34, 0.18], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          background:
            "radial-gradient(ellipse, rgba(255,232,158,0.48) 0%, rgba(210,244,236,0.25) 42%, rgba(255,255,255,0) 72%)",
          filter: "blur(12px)",
        }}
      />
    </>
  );
};

const EnergyRings: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {Array.from({length: 3}).map((_, index) => {
        const start = 17 + index * 13;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: "50%",
              top: 351,
              width: 230,
              height: 230,
              translate: "-50% -50%",
              borderRadius: "50%",
              border: `${index === 1 ? 3 : 2}px solid ${index % 2 === 0 ? "rgba(224,168,45,0.72)" : "rgba(0,142,124,0.58)"}`,
              scale: interpolate(frame, [start, start + 45], [0.35, 2.25], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              opacity: interpolate(frame, [start, start + 8, start + 38, start + 48], [0, 0.62, 0.16, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              boxShadow: index === 1 ? "0 0 28px rgba(0,142,124,0.18)" : "0 0 24px rgba(224,168,45,0.22)",
            }}
          />
        );
      })}
      {Array.from({length: 14}).map((_, index) => {
        const angle = (index / 14) * Math.PI * 2 + frame * 0.027;
        const radiusX = 184 + (index % 3) * 13;
        const radiusY = 128 + (index % 2) * 12;
        return (
          <div
            key={`orbit-${index}`}
            style={{
              position: "absolute",
              left: 960 + Math.cos(angle) * radiusX,
              top: 351 + Math.sin(angle) * radiusY,
              width: 5 + (index % 3) * 2,
              height: 5 + (index % 3) * 2,
              borderRadius: "50%",
              opacity: interpolate(frame, [20, 42, 91, 118], [0, 0.8, 0.55, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              color: index % 2 === 0 ? "#e6b34a" : "#22b6a4",
              background: index % 2 === 0 ? "#e6b34a" : "#22b6a4",
              boxShadow: "0 0 13px currentColor",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const FinalSparkles: React.FC = () => {
  const frame = useCurrentFrame();
  const points = [
    [684, 205],
    [1234, 252],
    [1312, 438],
    [611, 512],
    [738, 738],
    [1190, 785],
    [836, 908],
    [1084, 925],
  ];

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {points.map(([x, y], index) => {
        const start = 150 + index * 4;
        return (
          <div
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 15 + (index % 3) * 5,
              height: 15 + (index % 3) * 5,
              translate: "-50% -50%",
              rotate: `${index * 17 + frame * 0.7}deg`,
              clipPath: "polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)",
              background: index % 2 === 0 ? "#efbf52" : "#8be0cf",
              opacity: interpolate(frame, [start, start + 7, start + 18, start + 29], [0, 0.95, 0.55, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              scale: interpolate(frame, [start, start + 8, start + 25], [0.2, 1, 0.55], {
                easing: Easing.spring({damping: 14, stiffness: 120}),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              filter: "drop-shadow(0 0 8px rgba(230,178,68,0.72))",
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
            d="M410 35 C261 95 154 206 154 357 L154 515"
            strokeWidth="8"
            style={{
              strokeDasharray: 760,
              strokeDashoffset: interpolate(frame, [46, 102], [760, 0], {
                easing: Easing.bezier(0.65, 0, 0.35, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
          <path
            d="M410 35 C559 95 666 206 666 357 L666 515"
            strokeWidth="8"
            style={{
              strokeDasharray: 760,
              strokeDashoffset: interpolate(frame, [46, 102], [760, 0], {
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
        src={staticFile("opening-sfx-nasheed-sunnah.wav")}
        volume={(audioFrame) =>
          interpolate(audioFrame, [0, 12, 188, 209], [0, 0.92, 0.92, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <RadiantBackground />
      <EnergyRings />
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
        translateY={interpolate(frame, [18, 52], [18, 0], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        rotate={interpolate(frame, [18, 52], [-3.5, 0], {
          easing: Easing.spring({damping: 16, stiffness: 100}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
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
        scale={interpolate(frame, [55, 112], [0.98, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        })}
        translateY={interpolate(frame, [55, 112], [-10, 0], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        clipPath="inset(0 8% 39% 8%)"
      />

      <LogoImage
        name="Exact Arabic calligraphy"
        opacity={interpolate(frame, [102, 138], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        translateY={interpolate(frame, [100, 143], [24, 0], {
          easing: Easing.spring({damping: 18, stiffness: 95}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        clipPath={`inset(60% ${interpolate(frame, [100, 148], [50, 7], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% 11% ${interpolate(frame, [100, 148], [50, 7], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%)`}
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
        translateY={interpolate(frame, [132, 162], [22, 0], {
          easing: Easing.spring({damping: 16, stiffness: 110}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        clipPath="inset(88% 10% 0 10%)"
      />

      <LogoImage
        name="Exact complete original logo"
        opacity={interpolate(frame, [150, 166], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        scale={interpolate(frame, [150, 168, 184], [0.985, 1.014, 1], {
          easing: Easing.spring({damping: 17, stiffness: 105}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        })}
        translateY={interpolate(frame, [150, 170], [7, 0], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />

      <FinalSparkles />

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
