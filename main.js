import './style.css';
import { createMachine, interpret } from 'xstate';
import elements from './utils/elements';
import { inspect } from '@xstate/inspect';

/* inspect({
  iframe: false,
}); */

const machine = createMachine({
  initial: 'loading',
  states: {
    loading: {
      on: {
        LOADED: { target: 'playing' },
      },
    },
    paused: {
      on: {
        PLAY: { target: 'playing' },
      },
    },
    playing: {
      on: {
        PAUSE: { target: 'paused' },
      },
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

// start
service.send({ type: 'LOADED' });
