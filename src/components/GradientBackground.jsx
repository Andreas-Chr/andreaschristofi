import { Component, useEffect, useState } from 'react';
import GradientWaves from './vendor/GradientWaves';

class RendererBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** The renderer owns ready/failure state; the server-rendered image is the fallback. */
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
  return <RendererBoundary><GradientWaves horizonColor={canvas} waveColor="#303030" crestColor="#FFFFFF"
    speed={0.2} amplitude={2.8} waveScale={0.4} waveRatio={3} swell={15.5}
    turbulence={20} tilt={1.2} zoom={1} height={5.5} fogDepth={15} detail="high"
    brightness={0.5} grain grainIntensity={0.3} mouseInteraction
    parallaxStrength={0.7} className="live-waves" />
  </RendererBoundary>;
}
