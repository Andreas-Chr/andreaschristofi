import { Component, useEffect, useState } from 'react';
import GradientWaves from './vendor/GradientWaves';

class RendererBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** The artwork underneath remains visible before hydration and on renderer failure. */
export default function GradientBackground() {
  const [enabled, setEnabled] = useState(false);
  const [canvas, setCanvas] = useState('#121212');
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(!media.matches);
    setCanvas(getComputedStyle(document.documentElement).getPropertyValue('--color-background-canvas').trim());
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  if (!enabled) return null;
  return <RendererBoundary><GradientWaves horizonColor={canvas} waveColor="#303030"
    speed={0.25} amplitude={3.45} waveScale={0.35} waveRatio={3} swell={23.5}
    turbulence={25.5} tilt={1.01} detail="high" mouseInteraction={false} className="live-waves" />
  </RendererBoundary>;
}
