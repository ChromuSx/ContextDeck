import {Audio, Video} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {Backdrop, ContextPill, GradientText, LogoLockup} from "./Visuals";
import {COLORS, FONT} from "./theme";

const INTRO_FRAMES = 180;
const CAPTURE_FRAMES = 2130;
const OUTRO_FRAMES = 210;
const TRANSITION_FRAMES = 30;

export const MODERATOR_DEMO_DURATION =
  INTRO_FRAMES +
  CAPTURE_FRAMES +
  OUTRO_FRAMES -
  TRANSITION_FRAMES * 2;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        color: COLORS.text,
        fontFamily: FONT,
      }}
    >
      <Backdrop intensity={0.9} />
      <AbsoluteFill
        style={{
          padding: "100px 150px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 42,
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [0, 42], [0, 1], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: `0 ${interpolate(frame, [0, 42], [34, 0], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}px`,
          }}
        >
          <LogoLockup compact align="center" />
        </div>
        <div
          style={{
            opacity: interpolate(frame, [24, 72], [0, 1], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div
            style={{
              color: COLORS.cyan,
              fontSize: 34,
              fontWeight: 850,
              letterSpacing: 5,
            }}
          >
            REAL WINDOWS DEMONSTRATION
          </div>
          <div
            style={{
              marginTop: 24,
              maxWidth: 1350,
              fontSize: 92,
              fontWeight: 860,
              letterSpacing: -4,
              lineHeight: 1.04,
            }}
          >
            Select something.
            <br />
            <GradientText>Watch Stream Deck change.</GradientText>
          </div>
          <div
            style={{
              marginTop: 30,
              color: COLORS.muted,
              fontSize: 38,
              fontWeight: 550,
            }}
          >
            Text, file, folder, and image selections in one continuous capture
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const LiveCapture: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#020712"}}>
      <Video
        src={staticFile("moderator-demo-capture.mp4")}
        muted
        objectFit="contain"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        color: COLORS.text,
        fontFamily: FONT,
      }}
    >
      <Backdrop intensity={0.8} />
      <AbsoluteFill
        style={{
          padding: "100px 140px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 38,
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [0, 40], [0, 1], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <LogoLockup compact align="center" />
        </div>
        <div
          style={{
            opacity: interpolate(frame, [20, 62], [0, 1], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div
            style={{
              fontSize: 78,
              fontWeight: 860,
              letterSpacing: -3,
            }}
          >
            Four real selections. <GradientText>Four useful profiles.</GradientText>
          </div>
          <div
            style={{
              marginTop: 22,
              color: COLORS.muted,
              fontSize: 36,
            }}
          >
            Local detection on Windows. Profiles remain fully editable.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            opacity: interpolate(frame, [42, 88], [0, 1], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <ContextPill kind="text" active />
          <ContextPill kind="file" active />
          <ContextPill kind="folder" active />
          <ContextPill kind="image" active />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ModeratorDemo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: TRANSITION_FRAMES})}
        />
        <TransitionSeries.Sequence durationInFrames={CAPTURE_FRAMES}>
          <LiveCapture />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: TRANSITION_FRAMES})}
        />
        <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("audio/mixkit-digital-clouds.mp3")}
        volume={() =>
          interpolate(
            frame,
            [0, 60, MODERATOR_DEMO_DURATION - 90, MODERATOR_DEMO_DURATION],
            [0, 0.075, 0.075, 0],
            clamp,
          )
        }
      />
    </AbsoluteFill>
  );
};
