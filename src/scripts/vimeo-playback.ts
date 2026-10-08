import Player from '@vimeo/player';

type PlaybackPlayer = Pick<Player, 'ready' | 'getPaused' | 'pause' | 'play' | 'on' | 'off' | 'destroy'>;
interface Options { isActive: () => boolean; reducedMotion: () => boolean; }

/** Visibility changes pause playback, never navigate the iframe or seek the video. */
export function initVimeoPlayback(
  frame: HTMLIFrameElement,
  options: Options,
  createPlayer: (frame: HTMLIFrameElement) => PlaybackPlayer = frame => new Player(frame),
) {
  let disposed = false;
  let visible = true;
  let resume = false;
  let revision = 0;
  let generation = 0;
  let pausing = 0;
  let queue = Promise.resolve();
  let player: PlaybackPlayer;
  try { player = createPlayer(frame); } catch { return; }
  const active = () => !disposed && frame.isConnected && options.isActive();
  const reconcile = () => {
    const current = ++revision;
    const playbackGeneration = generation;
    // Serialize commands so a return during an in-flight pause can resume afterward.
    queue = queue.then(async () => {
      await player.ready();
      if (!active() || current !== revision) return;
      if (!visible) {
        const paused = await player.getPaused();
        if (!active() || current !== revision || paused) return;
        pausing++;
        try {
          await player.pause();
          if (active() && playbackGeneration === generation) resume = !options.reducedMotion();
        } finally { pausing--; }
      } else if (resume && !options.reducedMotion()) {
        resume = false;
        await player.play();
      }
    }).catch(() => { resume = false; /* Vimeo's own controls remain available. */ });
  };
  const onPlay = () => { if (active() && !visible) reconcile(); };
  const onPause = () => { if (visible && !pausing) resume = false; };
  const onEnded = () => { resume = false; };
  const listen = () => {
    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('ended', onEnded);
  };
  const unlisten = () => {
    player.off('play', onPlay);
    player.off('pause', onPause);
    player.off('ended', onEnded);
  };
  const reset = () => {
    resume = false;
    revision++;
    generation++;
    // A deliberate reduced-motion URL reload may leave old SDK requests unresolved.
    queue = Promise.resolve();
  };
  const onLoad = () => {
    if (!active()) return;
    reset();
    // A URL reload loses the remote event subscriptions, but keeps the SDK instance.
    unlisten();
    listen();
    reconcile();
  };
  listen();
  frame.addEventListener('load', onLoad);
  return {
    setVisible(value: boolean) {
      if (!active() || value === visible) return;
      visible = value;
      reconcile();
    },
    preventResume() { reset(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      reset();
      frame.removeEventListener('load', onLoad);
      unlisten();
      void player.destroy().catch(() => { /* The modal also removes its content. */ });
    },
  };
}
