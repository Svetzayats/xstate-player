import './style.css';
import { createMachine, interpret, assign, send } from 'xstate';
import elements from './utils/elements';
import { inspect } from '@xstate/inspect';
import { raise } from 'xstate/lib/actions';

/* inspect({
  iframe: false,
}); */

const machine = createMachine({
  initial: 'loading',
  context: {
    audio: null,
    volume: 50,
  },
  states: {
    loading: {
      on: {
        LOADED: {
          actions: ['saveAudio'],
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
    VOLUME: {
      actions: ['assignVolume'],
    },
  },
}).withConfig({
  actions: {
    saveAudio: ({ context, event }, params) => {
      console.log('saving ' + params.audio);
    },
    playAudio: ({ context, event }, params) => {
      console.log('play audio');
    },
    pauseAudio: ({ context, event }, params) => {
      console.log('pause audio');
    },
    skipAudio: ({ context, event }, params) => {
      console.log('skip audio');
    },
    likeAudio: ({ context, event }, params) => {
      console.log('like audio');
    },
    unlikeAudio: ({ context, event }, params) => {
      console.log('unlike audio');
    },
    dislikeAudio: ({ context, event }, params) => {
      console.log('dislike audio');
    },
    assignVolume: ({ context, event }, params) => {
      console.log('assign volume');
      assign({
        volume: ({ event }) => {
          console.log('event', event);
          console.log('params', params);
          return 100;
        },
      });
    },
  },
});

// event emitter
const service = interpret(machine, { devTools: true }).start();
service.subscribe((state) => {
  console.log(state.value);
  elements.elLoadingButton.hidden = !state.matches('loading');
  elements.elPlayButton.hidden = !state.can({ type: 'PLAY' });
  elements.elPauseButton.hidden = !state.can({ type: 'PAUSE' });
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
  service.send({ type: 'LIKE' });
});
elements.elDislikeButton.addEventListener('click', () => {
  service.send({ type: 'DISLIKE' });
});

// start
service.send({ type: 'LOADED', audio: 'loaded audio' });
