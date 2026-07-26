import type {CSSProperties, ReactNode} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {COLORS, ContextKind, FONT, PROFILE_COLORS} from "./theme";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const Backdrop: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background:
          "radial-gradient(circle at 48% 44%, #091a34 0%, #030a17 42%, #01040b 78%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 920,
          height: 920,
          left: -270,
          top: -280,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,216,255,${
            0.2 * intensity
          }) 0%, rgba(0,216,255,0) 68%)`,
          opacity: interpolate(frame, [0, 180, 360], [0.72, 1, 0.72], clamp),
          translate: `${interpolate(frame, [0, 360], [-30, 35], clamp)}px ${interpolate(
            frame,
            [0, 360],
            [15, -35],
            clamp,
          )}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -280,
          bottom: -330,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(122,44,255,${
            0.24 * intensity
          }) 0%, rgba(122,44,255,0) 68%)`,
          opacity: interpolate(frame, [0, 240, 480], [0.78, 1, 0.78], clamp),
          translate: `${interpolate(frame, [0, 480], [35, -20], clamp)}px ${interpolate(
            frame,
            [0, 480],
            [-10, 25],
            clamp,
          )}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(circle at center, black 0%, rgba(0,0,0,.6) 48%, transparent 82%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 180px 80px rgba(0,0,0,.72)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Enter: React.FC<{
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  style?: CSSProperties;
}> = ({children, delay = 0, direction = "up", distance = 42, style}) => {
  const frame = useCurrentFrame();
  const x =
    direction === "left" ? distance : direction === "right" ? -distance : 0;
  const y =
    direction === "up" ? distance : direction === "down" ? -distance : 0;

  return (
    <div
      style={{
        ...style,
        opacity: interpolate(frame, [delay, delay + 42], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: `${interpolate(frame, [delay, delay + 42], [x, 0], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px ${interpolate(frame, [delay, delay + 42], [y, 0], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px`,
        scale: interpolate(frame, [delay, delay + 42], [0.97, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {children}
    </div>
  );
};

export const GradientText: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
}> = ({children, style}) => (
  <span
    style={{
      color: "transparent",
      background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.blue} 52%, ${COLORS.violet})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      ...style,
    }}
  >
    {children}
  </span>
);

export const LogoLockup: React.FC<{
  compact?: boolean;
  align?: "left" | "center";
}> = ({compact = false, align = "left"}) => (
  <div
    style={{
      display: "flex",
      flexDirection: compact ? "row" : "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: compact ? 22 : 16,
    }}
  >
    <Img
      src={staticFile("plugin-icon.png")}
      style={{
        width: compact ? 108 : 250,
        height: compact ? 108 : 250,
        objectFit: "contain",
        filter: "drop-shadow(0 0 34px rgba(50,112,255,.42))",
      }}
    />
    <div
      style={{
        color: COLORS.text,
        fontFamily: FONT,
        fontWeight: 850,
        fontSize: compact ? 48 : 74,
        letterSpacing: -2.5,
        lineHeight: 1,
      }}
    >
      Context<GradientText>Deck</GradientText>
    </div>
  </div>
);

const IconGlyph: React.FC<{kind: ContextKind; size?: number}> = ({
  kind,
  size = 54,
}) => {
  const color = PROFILE_COLORS[kind];
  if (kind === "text") {
    return (
      <div
        style={{
          color,
          fontFamily: "Georgia, serif",
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
        }}
      >
        T
      </div>
    );
  }

  if (kind === "file") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path
          d="M15 7h23l12 12v38H15z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path d="M38 7v13h12" fill="none" stroke={color} strokeWidth="5" />
      </svg>
    );
  }

  if (kind === "folder") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path
          d="M7 17h21l6 7h23v30H7z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect
        x="7"
        y="9"
        width="50"
        height="46"
        rx="5"
        fill="none"
        stroke={color}
        strokeWidth="5"
      />
      <circle cx="44" cy="22" r="5" fill={color} />
      <path
        d="M11 50l15-16 10 10 7-7 11 13"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CONTEXT_LABELS: Record<ContextKind, string> = {
  text: "TEXT",
  file: "FILE",
  folder: "FOLDER",
  image: "IMAGE",
};

export const ContextPill: React.FC<{
  kind: ContextKind;
  active?: boolean;
}> = ({kind, active = false}) => {
  const color = PROFILE_COLORS[kind];
  return (
    <div
      style={{
        minWidth: 210,
        height: 92,
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        color: active ? COLORS.text : COLORS.muted,
        border: `2px solid ${active ? color : "rgba(140,170,220,.18)"}`,
        borderRadius: 24,
        background: active
          ? `linear-gradient(145deg, ${color}24, rgba(8,18,36,.94))`
          : "rgba(7,16,31,.72)",
        boxShadow: active ? `0 0 38px ${color}50, inset 0 0 20px ${color}18` : "none",
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: 1.2,
      }}
    >
      <IconGlyph kind={kind} size={44} />
      {CONTEXT_LABELS[kind]}
    </div>
  );
};

const PROFILE_ACTIONS: Record<ContextKind, string[]> = {
  text: ["T", "COPY", "Aa", "¶", "FIND", "NOTE", "CASE", "CODE", "PASTE", "EDIT", "LIST", "LINK", "UNDO", "SAVE", "•••"],
  file: ["FILE", "OPEN", "COPY", "MOVE", "TAG", "INFO", "NAME", "PATH", "ZIP", "SHARE", "STAR", "SYNC", "NEW", "SAVE", "•••"],
  folder: ["DIR", "OPEN", "NEW", "FIND", "PATH", "COPY", "MOVE", "SYNC", "STAR", "PIN", "TERM", "INFO", "BACK", "SAVE", "•••"],
  image: ["IMG", "VIEW", "CROP", "SIZE", "EDIT", "ROTATE", "COLOR", "EXPORT", "SHARE", "FAV", "TAG", "INFO", "UNDO", "SAVE", "•••"],
};

const Key: React.FC<{
  label: string;
  color: string;
  featured?: boolean;
}> = ({label, color, featured = false}) => (
  <div
    style={{
      height: 84,
      borderRadius: 17,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: featured ? COLORS.text : "#c8d5e8",
      background: featured
        ? `linear-gradient(145deg, ${color}55, rgba(8,18,36,.95))`
        : "linear-gradient(145deg, #12233d, #07101f)",
      border: `2px solid ${featured ? color : "rgba(125,165,225,.3)"}`,
      boxShadow: featured ? `0 0 24px ${color}45` : "inset 0 1px 0 rgba(255,255,255,.06)",
      fontFamily: FONT,
      fontWeight: 780,
      fontSize: label.length > 4 ? 15 : 24,
      letterSpacing: label.length > 4 ? 0.4 : 0,
      textAlign: "center",
      lineHeight: 1,
    }}
  >
    {label}
  </div>
);

export const StreamDeck: React.FC<{
  kind: ContextKind;
  width?: number;
  showLabel?: boolean;
}> = ({kind, width = 700, showLabel = true}) => {
  const frame = useCurrentFrame();
  const color = PROFILE_COLORS[kind];

  return (
    <div
      style={{
        width,
        padding: 28,
        borderRadius: 42,
        background: "linear-gradient(155deg, #172640 0%, #080f1d 58%, #050912 100%)",
        border: "2px solid rgba(146,184,235,.35)",
        boxShadow: `0 42px 90px rgba(0,0,0,.58), 0 0 46px ${color}32, inset 0 2px 1px rgba(255,255,255,.08)`,
        rotate: `${interpolate(frame, [0, 240], [-1.3, 0.7], clamp)}deg`,
      }}
    >
      {showLabel ? (
        <div
          style={{
            margin: "2px 4px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: FONT,
          }}
        >
          <div style={{display: "flex", alignItems: "center", gap: 14}}>
            <IconGlyph kind={kind} size={34} />
            <div
              style={{
                color: COLORS.text,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 0.8,
              }}
            >
              {CONTEXT_LABELS[kind]} PROFILE
            </div>
          </div>
          <div style={{color: COLORS.muted, fontSize: 17}}>
            Your actions
          </div>
        </div>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 14,
        }}
      >
        {PROFILE_ACTIONS[kind].map((label, index) => (
          <Key
            key={`${kind}-${label}-${index}`}
            label={label}
            color={color}
            featured={index === 0 || index === 7}
          />
        ))}
      </div>
    </div>
  );
};

export const SelectionWindow: React.FC<{
  kind: ContextKind;
  width?: number;
}> = ({kind, width = 700}) => {
  const color = PROFILE_COLORS[kind];
  const frame = useCurrentFrame();
  const selection =
    kind === "text"
      ? interpolate(frame, [40, 120], [0, 100], clamp)
      : interpolate(frame, [20, 72], [0, 100], clamp);

  return (
    <div
      style={{
        width,
        height: 500,
        borderRadius: 30,
        overflow: "hidden",
        color: COLORS.text,
        background: "rgba(6,14,27,.96)",
        border: "2px solid rgba(148,184,230,.34)",
        boxShadow: "0 35px 75px rgba(0,0,0,.52)",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "rgba(255,255,255,.035)",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div style={{display: "flex", gap: 10}}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: item === 0 ? color : "rgba(160,180,210,.28)",
              }}
            />
          ))}
        </div>
        <div style={{color: COLORS.muted, fontSize: 18}}>
          {kind === "text" ? "Document" : "File Explorer"}
        </div>
        <div style={{width: 54}} />
      </div>
      {kind === "text" ? (
        <div style={{padding: "62px 58px", fontSize: 34, lineHeight: 1.72}}>
          <div>ContextDeck follows your selection.</div>
          <div>The right profile appears</div>
          <div>
            <span
              style={{
                position: "relative",
                display: "inline-block",
                color: COLORS.text,
                zIndex: 0,
              }}
            >
              automatically.
              <span
                style={{
                  position: "absolute",
                  left: -5,
                  bottom: 2,
                  width: `${selection}%`,
                  height: 42,
                  borderRadius: 7,
                  background: `${color}66`,
                  boxShadow: `0 0 22px ${color}50`,
                  zIndex: -1,
                }}
              />
            </span>
          </div>
          <div style={{marginTop: 46, color: COLORS.muted, fontSize: 25}}>
            Select text. Keep working.
          </div>
        </div>
      ) : (
        <div style={{padding: "38px 42px"}}>
          <div
            style={{
              height: 54,
              display: "grid",
              gridTemplateColumns: "1.4fr .8fr .5fr",
              alignItems: "center",
              color: COLORS.muted,
              borderBottom: "1px solid rgba(255,255,255,.08)",
              fontSize: 17,
            }}
          >
            <div>Name</div>
            <div>Type</div>
            <div>Size</div>
          </div>
          {[
            kind === "file" ? "ContextDeck-notes.txt" : kind === "folder" ? "ContextDeck Assets" : "ContextDeck-logo.png",
            "Project Brief.pdf",
            "Marketplace",
            "README.md",
          ].map((name, index) => {
            const selected = index === 0;
            return (
              <div
                key={name}
                style={{
                  height: 74,
                  padding: "0 18px",
                  display: "grid",
                  gridTemplateColumns: "1.4fr .8fr .5fr",
                  alignItems: "center",
                  borderRadius: 12,
                  color: selected ? COLORS.text : COLORS.muted,
                  background: selected
                    ? `linear-gradient(90deg, ${color}40, ${color}12)`
                    : "transparent",
                  border: selected
                    ? `1px solid ${color}${Math.round(selection * 1.8)
                        .toString(16)
                        .padStart(2, "0")}`
                    : "1px solid transparent",
                  fontSize: 20,
                }}
              >
                <div style={{display: "flex", alignItems: "center", gap: 14}}>
                  {selected ? <IconGlyph kind={kind} size={30} /> : null}
                  {name}
                </div>
                <div>{selected ? CONTEXT_LABELS[kind] : index === 2 ? "Folder" : "File"}</div>
                <div>{index === 2 ? "—" : `${index + 1}.4 MB`}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FlowBeam: React.FC<{color?: string}> = ({
  color = COLORS.cyan,
}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  return (
    <svg
      width={width}
      height="220"
      viewBox="0 0 1920 220"
      style={{
        position: "absolute",
        left: 0,
        top: 450,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter id="beam-glow" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="beam-gradient" x1="0" x2="1">
          <stop offset="0" stopColor={COLORS.cyan} />
          <stop offset=".55" stopColor={color} />
          <stop offset="1" stopColor={COLORS.violet} />
        </linearGradient>
      </defs>
      <path
        d="M520 110 C760 15 1110 205 1400 102"
        fill="none"
        stroke="url(#beam-gradient)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="22 18"
        strokeDashoffset={interpolate(frame, [0, 240], [180, -240], clamp)}
        opacity={interpolate(frame, [0, 28], [0, 0.95], clamp)}
        filter="url(#beam-glow)"
      />
      <path
        d="M520 110 C760 15 1110 205 1400 102"
        fill="none"
        stroke="rgba(255,255,255,.9)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={interpolate(frame, [0, 34], [0, 0.8], clamp)}
      />
    </svg>
  );
};

export const PropertyInspector: React.FC = () => {
  const frame = useCurrentFrame();
  const enabled = frame < 330 || Math.floor(frame / 80) % 2 === 0;
  const rows = [
    ["Selected text", true],
    ["Files", true],
    ["Folders", true],
    ["Image files", true],
  ] as const;

  return (
    <div
      style={{
        width: 520,
        height: 740,
        padding: "30px 34px",
        color: "#dedede",
        background: "#2d2d2d",
        borderRadius: 26,
        border: "2px solid rgba(255,255,255,.16)",
        boxShadow: "0 35px 80px rgba(0,0,0,.55)",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 8,
          color: "#c8d8ec",
          background: "#353535",
          border: "1px solid #4a4a4a",
          fontSize: 17,
        }}
      >
        Ready · Detected: No selection
      </div>
      <InspectorTitle>Automatic Switching</InspectorTitle>
      <CheckRow
        label="Enable automatic profile switching"
        checked={enabled}
      />
      <InspectorTitle>Contexts</InspectorTitle>
      {rows.map(([label, checked]) => (
        <CheckRow key={label} label={label} checked={checked} />
      ))}
      <InspectorTitle>Timing</InspectorTitle>
      <Field label="Switch delay" value="300 ms" />
      <Field label="Return delay" value="700 ms" />
      <InspectorTitle>Target Devices</InspectorTitle>
      <CheckRow label="Office Stream Deck" checked />
      <CheckRow label="Stream Deck +" checked />
    </div>
  );
};

const InspectorTitle: React.FC<{children: ReactNode}> = ({children}) => (
  <div
    style={{
      margin: "24px 0 12px",
      paddingBottom: 7,
      color: "#38a7ff",
      borderBottom: "1px solid #515151",
      fontSize: 16,
      fontWeight: 700,
    }}
  >
    {children}
  </div>
);

const CheckRow: React.FC<{label: string; checked: boolean}> = ({
  label,
  checked,
}) => (
  <div
    style={{
      minHeight: 39,
      display: "flex",
      alignItems: "center",
      gap: 11,
      fontSize: 17,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        background: checked ? "#1478c9" : "#3a3a3a",
        border: `1px solid ${checked ? "#45b7ff" : "#616161"}`,
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 900,
      }}
    >
      {checked ? "✓" : ""}
    </div>
    {label}
  </div>
);

const Field: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div
    style={{
      marginBottom: 10,
      display: "grid",
      gridTemplateColumns: "1fr 130px",
      alignItems: "center",
      gap: 16,
      color: "#bcbcbc",
      fontSize: 16,
    }}
  >
    <div>{label}</div>
    <div
      style={{
        padding: "7px 10px",
        color: "#dedede",
        background: "#3a3a3a",
        border: "1px solid #515151",
        borderRadius: 5,
        textAlign: "right",
      }}
    >
      {value}
    </div>
  </div>
);

export const MiniProfile: React.FC<{kind: ContextKind}> = ({kind}) => {
  const color = PROFILE_COLORS[kind];
  return (
    <div
      style={{
        width: 330,
        height: 260,
        padding: 22,
        borderRadius: 26,
        background: `linear-gradient(150deg, ${color}20, rgba(6,14,27,.94))`,
        border: `2px solid ${color}80`,
        boxShadow: `0 0 32px ${color}25`,
        fontFamily: FONT,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 12}}>
        <IconGlyph kind={kind} size={34} />
        <div
          style={{
            color,
            fontWeight: 850,
            fontSize: 22,
            letterSpacing: 0.8,
          }}
        >
          {CONTEXT_LABELS[kind]}
        </div>
      </div>
      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 11,
        }}
      >
        {PROFILE_ACTIONS[kind].slice(0, 12).map((label, index) => (
          <div
            key={`${kind}-mini-${label}-${index}`}
            style={{
              height: 45,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              color: index < 2 ? COLORS.text : COLORS.muted,
              background: index < 2 ? `${color}30` : "#0b1728",
              border: `1px solid ${index < 2 ? color : "rgba(130,170,225,.25)"}`,
              fontSize: label.length > 4 ? 8 : 13,
              fontWeight: 780,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export const LocalFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [0, 80, 160], [0.5, 1, 0.5], clamp);
  return (
    <div
      style={{
        width: 1430,
        display: "grid",
        gridTemplateColumns: "1fr 260px 1fr",
        alignItems: "center",
        gap: 70,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          height: 260,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          borderRadius: 32,
          color: COLORS.text,
          background: "rgba(7,17,33,.88)",
          border: "2px solid rgba(49,168,255,.42)",
        }}
      >
        <div
          style={{
            width: 120,
            height: 82,
            border: `7px solid ${COLORS.blue}`,
            borderRadius: 12,
            position: "relative",
            boxShadow: `0 0 26px ${COLORS.blue}55`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 34,
              right: 34,
              bottom: -24,
              height: 8,
              borderRadius: 4,
              background: COLORS.blue,
            }}
          />
        </div>
        <div style={{fontSize: 28, fontWeight: 800}}>WINDOWS SELECTION</div>
      </div>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 16}}>
        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(8,18,35,.96)",
            border: `3px solid ${COLORS.cyan}`,
            boxShadow: `0 0 ${50 * pulse}px ${COLORS.cyan}70`,
          }}
        >
          <Img
            src={staticFile("plugin-icon.png")}
            style={{width: 154, height: 154, objectFit: "contain"}}
          />
        </div>
        <div
          style={{
            color: COLORS.cyan,
            fontSize: 22,
            fontWeight: 820,
            textAlign: "center",
          }}
        >
          LOCAL DETECTION
        </div>
      </div>
      <div
        style={{
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 32,
          background: "rgba(7,17,33,.88)",
          border: "2px solid rgba(151,72,255,.5)",
        }}
      >
        <StreamDeck kind="image" width={510} showLabel={false} />
      </div>
    </div>
  );
};
