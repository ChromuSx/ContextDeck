import {Composition} from "remotion";
import {ContextDeckPromo} from "./ContextDeckPromo";
import {MODERATOR_DEMO_DURATION, ModeratorDemo} from "./ModeratorDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ContextDeckPromo"
        component={ContextDeckPromo}
        durationInFrames={2040}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="ContextDeckModeratorDemo"
        component={ModeratorDemo}
        durationInFrames={MODERATOR_DEMO_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
