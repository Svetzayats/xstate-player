import './style.css';
import { createMachine, interpret, assign, send } from 'xstate';
import elements from './utils/elements';
import { inspect } from '@xstate/inspect';
import { raise } from 'xstate/lib/actions';
import { formatTime } from './utils/formatTime';

/* inspect({
  iframe: false,
}); */

const machine = createMachine({
  initial: 'loading',
  context: {
    title: undefined,
    artist: undefined,
    duration: 0,
    elapsed: 0,
    volume: 5,
    likeStatus: 'unliked', // 'liked' | 'unliked' | 'disliked',
  },
  states: {
    loading: {
      on: {
        LOADED: {
          actions: ['assignAudioInfo'],
          target: 'playing',
        },
      },
    },
    paused: {
      on: {
        PLAY: { target: 'playing' },
      },
    },
    playing: {
      entry: ['playAudio'],
      exit: ['pauseAudio'],
      on: {
        PAUSE: { target: 'paused' },
      },
      always: {
        cond: (context) => context.elapsed >= context.duration,
        target: 'paused',
      },
    },
  },
  on: {
    SKIP: {
      actions: ['skipAudio'],
      target: 'loading',
    },
    LIKE: {
      actions: ['likeAudio'],
    },
    UNLIKE: {
      actions: ['unlikeAudio'],
    },
    DISLIKE: {
      actions: ['dislikeAudio', raise('SKIP')],
    },
    'LIKE.TOGGLE': [
      {
        cond: (context) => context.likeStatus === 'liked',
        actions: [raise('UNLIKE')],
      },
      {
        cond: (context) => context.likeStatus === 'unliked',
        actions: [raise('LIKE')],
      },
    ],
    VOLUME: {
      cond: 'volumeInRange',
      actions: ['assignVolume'],
    },
    'AUDIO.TIME': {
      actions: 'assignTime',
    },
  },
}).withConfig({
  actions: {
    assignAudioInfo: assign({
      title: (_, event) => event.data.title,
      artist: (_, event) => event.data.artist,
      duration: (_, event) => event.data.duration,
      likeStatus: 'unliked',
      elapsed: 0,
    }),
    playAudio: ({ context, event }, params) => {
      console.log('play audio');
    },
    pauseAudio: ({ context, event }, params) => {
      console.log('pause audio');
    },
    skipAudio: ({ context, event }, params) => {
      console.log('skip audio');
    },
    likeAudio: assign({
      likeStatus: 'liked',
    }),
    unlikeAudio: assign({
      likeStatus: 'unliked',
    }),
    dislikeAudio: assign({
      likeStatus: 'disliked',
    }),
    assignVolume: assign({
      volume: (_, event) => event.level,
    }),
    assignTime: assign({
      elapsed: (_, event) => event.currentTime,
    }),
  },
  guards: {
    volumeInRange: (_, event) => event.level >= 0 && event.level <= 10,
  },
});

// event emitter
const service = interpret(machine, { devTools: true }).start();
service.subscribe((state) => {
  console.log(state.context);
  const { context } = state;

  elements.elLoadingButton.hidden = !state.hasTag('loading');
  elements.elPlayButton.hidden = !state.can({ type: 'PLAY' });
  elements.elPauseButton.hidden = !state.can({ type: 'PAUSE' });
  elements.elVolumeButton.dataset.level =
    context.volume === 0
      ? 'zero'
      : context.volume <= 2
        ? 'low'
        : context.volume >= 8
          ? 'high'
          : undefined;

  elements.elScrubberInput.setAttribute('max', context.duration);
  elements.elScrubberInput.value = context.elapsed;
  elements.elElapsedOutput.innerHTML = formatTime(
    context.elapsed - context.duration,
  );

  elements.elLikeButton.dataset.likeStatus = context.likeStatus;
  elements.elArtist.innerHTML = context.artist;
  elements.elTitle.innerHTML = context.title;
});

// button handlers
elements.elPlayButton.addEventListener('click', () => {
  service.send({ type: 'PLAY' });
});

elements.elPauseButton.addEventListener('click', () => {
  service.send({ type: 'PAUSE' });
});

elements.elSkipButton.addEventListener('click', () => {
  service.send({ type: 'SKIP' });
});
elements.elLikeButton.addEventListener('click', () => {
  service.send({ type: 'LIKE.TOGGLE' });
});
elements.elDislikeButton.addEventListener('click', () => {
  service.send({ type: 'DISLIKE' });
});

// start
service.send({
  type: 'LOADED',
  data: { title: 'Super song', artist: 'Taylor Swift', duration: 500 },
});

service.send({
  type: 'VOLUME',
  level: 75,
});

service.send({
  type: 'AUDIO.TIME',
  currentTime: 230,
});

window.machine = service;
