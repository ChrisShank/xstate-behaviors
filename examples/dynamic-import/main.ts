import { createMachine, interpret, send } from 'xstate';
import { log } from 'xstate/lib/actions';
import { fromDynamicImport } from '@src';

const pongMachine = createMachine({
  id: 'pong',
  invoke: {
    id: 'ping',
    src: () => fromDynamicImport(async () => (await import('./ping.machine')).pingMachine),
  },
  entry: send({ type: 'PING' }, { to: 'ping' }),
  initial: 'active',
  states: {
    active: {
      on: {
        PONG: {
          actions: [log('PONG'), send({ type: 'PING' }, { to: 'ping', delay: 1000 })],
        },
        STOP: 'complete',
      },
    },
    complete: {},
  },
});

const service = interpret(pongMachine).start();
