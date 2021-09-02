import { createMachine, interpret, send, actions } from 'xstate';
import { fromWebWorker } from '@src';

const { log } = actions;

const pongMachine = createMachine({
  id: 'pong',
  invoke: {
    id: 'ping',
    src: () =>
      fromWebWorker(() => new Worker(new URL('./worker', import.meta.url), { type: 'module' })),
  },
  entry: send({ type: 'PING' }, { to: 'ping' }),
  on: {
    PONG: {
      actions: [log('PONG'), send({ type: 'PING' }, { to: 'ping', delay: 1000 })],
    },
  },
});

const service = interpret(pongMachine).start();
