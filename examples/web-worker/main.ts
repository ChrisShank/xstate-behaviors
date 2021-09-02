import { createMachine, interpret, send, actions } from 'xstate';
import { fromWebWorker } from '@src';

const { log } = actions;

const pingMachine = createMachine({
  id: 'ping',
  invoke: {
    id: 'pong',
    src: fromWebWorker(() => new Worker(new URL('./worker', import.meta.url), { type: 'module' })),
  },
  entry: send({ type: 'PING' }, { to: 'pong' }),
  initial: 'active',
  states: {
    active: {
      on: {
        PONG: {
          actions: [log('PONG'), send({ type: 'PING' }, { to: 'pong', delay: 1000 })],
        },
        STOP: 'complete',
      },
    },
    complete: {},
  },
});

const service = interpret(pingMachine).start();
