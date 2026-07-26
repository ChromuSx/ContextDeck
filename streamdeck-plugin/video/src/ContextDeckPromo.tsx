import {Audio} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  Backdrop,
  ContextPill,
  Enter,
  FlowBeam,
  GradientText,
  LocalFlow,
  LogoLockup,
  MiniProfile,
  PropertyInspector,
  SelectionWindow,
  StreamDeck,
} from "./Visuals";
import {COLORS, ContextKind, FONT, PROFILE_COLORS} from "./theme";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const KINDS: ContextKind[] = ["text", "file", "folder", "image"];
const TRANSITION_FRAMES = 24;

const FrameHeader: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}> = ({eyebrow, title, subtitle}) => (
  <div
    style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        color: COLORS.cyan,
        fontSize: 23,
        fontWeight: 820,
        letterSpacing: 5,
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        marginTop: 14,
        color: COLORS.text,
        fontSize: 80,
        fontWeight: 900,
        letterSpacing: -3.5,
        lineHeight: 1.04,
      }}
    >
      {title}
    </div>
    {subtitle ? (
      <div
        style={{
          marginTop: 17,
          maxWidth: 1120,
          color: COLORS.muted,
          fontSize: 31,
          fontWeight: 520,
          lineHeight: 1.35,
        }}
      >
        {subtitle}
      </div>
    ) : null}
  </div>
);

const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop intensity={1.1} />
      <AbsoluteFill
        style={{
          padding: "94px 112px",
          display: "grid",
          gridTemplateColumns: "700px 1fr",
          alignItems: "center",
          gap: 80,
        }}
      >
        <Enter direction="right" delay={6}>
          <LogoLockup />
          <div
            style={{
              marginTop: 42,
              maxWidth: 720,
              color: COLORS.text,
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: -3.4,
              lineHeight: 1.02,
            }}
          >
            Your context changes.
            <br />
            <GradientText>Your controls follow.</GradientText>
          </div>
          <div
            style={{
              marginTop: 30,
              maxWidth: 650,
              color: COLORS.muted,
              fontSize: 30,
              lineHeight: 1.45,
            }}
          >
            Automatically show the profile you configured for selected text,
            files, folders, and images.
          </div>
        </Enter>
        <Enter direction="left" delay={28}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
              scale: interpolate(frame, [0, 300], [0.985, 1.02], clamp),
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 18,
              }}
            >
              {KINDS.map((kind, index) => (
                <ContextPill
                  key={kind}
                  kind={kind}
                  active={Math.floor(frame / 60) % 4 === index}
                />
              ))}
            </div>
            <StreamDeck
              kind={KINDS[Math.floor(frame / 72) % KINDS.length]}
              width={720}
            />
          </div>
        </Enter>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const active = frame > 120;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop />
      <FlowBeam color={PROFILE_COLORS.text} />
      <AbsoluteFill style={{padding: "72px 100px"}}>
        <Enter delay={4}>
          <FrameHeader
            eyebrow="SELECT TEXT"
            title={
              <>
                Keep working. <GradientText>ContextDeck reacts.</GradientText>
              </>
            }
            subtitle="The Text profile becomes active as soon as a text selection is detected."
          />
        </Enter>
        <div
          style={{
            marginTop: 62,
            display: "grid",
            gridTemplateColumns: "700px 1fr 700px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Enter direction="right" delay={18}>
            <SelectionWindow kind="text" />
          </Enter>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 190,
                height: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                borderRadius: 36,
                color: active ? COLORS.text : COLORS.muted,
                background: active
                  ? "linear-gradient(90deg, rgba(0,215,255,.28), rgba(99,45,255,.28))"
                  : "rgba(9,20,38,.8)",
                border: `2px solid ${active ? COLORS.cyan : "rgba(130,170,220,.25)"}`,
                boxShadow: active ? `0 0 34px ${COLORS.cyan}50` : "none",
                opacity: interpolate(frame, [80, 122], [0, 1], clamp),
                scale: interpolate(frame, [80, 122], [0.8, 1], {
                  ...clamp,
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                fontSize: 20,
                fontWeight: 850,
              }}
            >
              DETECTED
            </div>
          </div>
          <Enter direction="left" delay={92}>
            <StreamDeck kind="text" />
          </Enter>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ContextsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const step = Math.min(KINDS.length - 1, Math.floor(frame / 120));
  const kind = KINDS[step];
  const color = PROFILE_COLORS[kind];

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop intensity={1.08} />
      <AbsoluteFill style={{padding: "68px 100px"}}>
        <FrameHeader
          eyebrow="FOUR CONTEXTS"
          title={
            <>
              One selection. <GradientText>The right profile.</GradientText>
            </>
          }
          subtitle="Text, files, folders, and image files can each activate a profile you control."
        />
        <div
          style={{
            marginTop: 34,
            display: "flex",
            justifyContent: "center",
            gap: 18,
          }}
        >
          {KINDS.map((item) => (
            <ContextPill key={item} kind={item} active={item === kind} />
          ))}
        </div>
        <div
          style={{
            marginTop: 42,
            display: "grid",
            gridTemplateColumns: "700px 700px",
            justifyContent: "center",
            gap: 120,
            alignItems: "center",
          }}
        >
          <div
            style={{
              opacity: interpolate(frame % 120, [0, 20, 100, 119], [0, 1, 1, 0], clamp),
              translate: `${interpolate(frame % 120, [0, 20], [-28, 0], clamp)}px 0px`,
            }}
          >
            <SelectionWindow kind={kind} />
          </div>
          <div
            style={{
              opacity: interpolate(frame % 120, [8, 32, 104, 119], [0, 1, 1, 0], clamp),
              translate: `${interpolate(frame % 120, [8, 32], [28, 0], clamp)}px 0px`,
            }}
          >
            <StreamDeck kind={kind} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 42,
            translate: "-50% 0",
            color,
            fontSize: 22,
            fontWeight: 850,
            letterSpacing: 3,
          }}
        >
          EXAMPLE PROFILE · FULLY CONFIGURABLE
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SettingsScene: React.FC = () => (
  <AbsoluteFill style={{fontFamily: FONT}}>
    <Backdrop />
    <AbsoluteFill
      style={{
        padding: "72px 112px",
        display: "grid",
        gridTemplateColumns: "560px 1fr",
        alignItems: "center",
        gap: 100,
      }}
    >
      <Enter direction="right" delay={8}>
        <PropertyInspector />
      </Enter>
      <div>
        <Enter direction="left" delay={12}>
          <div
            style={{
              color: COLORS.text,
              fontSize: 82,
              fontWeight: 920,
              lineHeight: 1.02,
              letterSpacing: -3.4,
            }}
          >
            Your profiles.
            <br />
            <GradientText>Your way.</GradientText>
          </div>
          <div
            style={{
              marginTop: 22,
              maxWidth: 850,
              color: COLORS.muted,
              fontSize: 30,
              lineHeight: 1.4,
            }}
          >
            Choose which contexts are active, tune switching, target your
            devices, and build every profile with the actions you want.
          </div>
        </Enter>
        <div
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "repeat(2, 330px)",
            gap: 20,
          }}
        >
          {KINDS.map((kind, index) => (
            <Enter key={kind} delay={44 + index * 15}>
              <MiniProfile kind={kind} />
            </Enter>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const PrivacyScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop intensity={0.9} />
      <AbsoluteFill
        style={{
          padding: "80px 110px",
          alignItems: "center",
        }}
      >
        <Enter>
          <FrameHeader
            eyebrow="PRIVATE BY DEFAULT"
            title={
              <>
                <GradientText>Local by design.</GradientText>
              </>
            }
            subtitle="ContextDeck receives only the selection category and foreground process name."
          />
        </Enter>
        <Enter delay={34} style={{marginTop: 94}}>
          <LocalFlow />
        </Enter>
        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            gap: 20,
            color: COLORS.text,
            fontSize: 30,
            fontWeight: 720,
            opacity: interpolate(frame, [80, 126], [0, 1], clamp),
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              color: COLORS.background,
              background: COLORS.green,
              boxShadow: `0 0 30px ${COLORS.green}55`,
              fontSize: 32,
              fontWeight: 950,
            }}
          >
            ✓
          </div>
          Selected text, paths, and file contents remain on your computer.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Backdrop intensity={1.15} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "90px 120px",
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [0, 40], [0, 1], clamp),
            scale: interpolate(frame, [0, 50, 240], [0.86, 1, 1.035], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <Img
            src={staticFile("plugin-icon.png")}
            style={{
              width: 250,
              height: 250,
              objectFit: "contain",
              filter: "drop-shadow(0 0 44px rgba(51,115,255,.54))",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 22,
            color: COLORS.text,
            fontSize: 98,
            fontWeight: 930,
            letterSpacing: -4.2,
            opacity: interpolate(frame, [22, 66], [0, 1], clamp),
          }}
        >
          Context<GradientText>Deck</GradientText>
        </div>
        <div
          style={{
            marginTop: 24,
            color: COLORS.text,
            fontSize: 48,
            fontWeight: 760,
            opacity: interpolate(frame, [48, 90], [0, 1], clamp),
          }}
        >
          The right controls. Right when you need them.
        </div>
        <div
          style={{
            marginTop: 42,
            display: "flex",
            gap: 16,
            opacity: interpolate(frame, [76, 116], [0, 1], clamp),
          }}
        >
          {["WINDOWS", "LOCAL DETECTION", "USER-CONFIGURABLE PROFILES"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "14px 22px",
                  color: COLORS.muted,
                  background: "rgba(9,20,38,.78)",
                  border: "1px solid rgba(117,170,235,.25)",
                  borderRadius: 28,
                  fontSize: 18,
                  fontWeight: 760,
                  letterSpacing: 1,
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>
        <div
          style={{
            marginTop: 40,
            color: COLORS.cyan,
            fontSize: 23,
            fontWeight: 850,
            letterSpacing: 4,
            opacity: interpolate(frame, [102, 146], [0, 1], clamp),
          }}
        >
          AVAILABLE ON ELGATO MARKETPLACE
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ContextDeckPromo: React.FC = () => {
  const transitionTiming = linearTiming({
    durationInFrames: TRANSITION_FRAMES,
  });

  return (
    <AbsoluteFill style={{background: COLORS.background}}>
      <Audio
        src={staticFile("audio/mixkit-digital-clouds.mp3")}
        volume={(frame) =>
          interpolate(
            frame,
            [0, 90, 1920, 2040],
            [0, 0.42, 0.42, 0],
            clamp,
          )
        }
      />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={300}>
          <HeroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />
        <TransitionSeries.Sequence durationInFrames={420}>
          <TextScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />
        <TransitionSeries.Sequence durationInFrames={480}>
          <ContextsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />
        <TransitionSeries.Sequence durationInFrames={390}>
          <SettingsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />
        <TransitionSeries.Sequence durationInFrames={300}>
          <PrivacyScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />
        <TransitionSeries.Sequence durationInFrames={270}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
