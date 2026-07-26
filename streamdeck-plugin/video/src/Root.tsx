import {Composition} from "remotion";
import {ContextDeckPromo} from "./ContextDeckPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ContextDeckPromo"
      component={ContextDeckPromo}
      durationInFrames={2040}
      fps={60}
      width={1920}
      height={1080}
    />
  );
};
