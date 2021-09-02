import { createMachine, interpret, send } from 'xstate';
import { fromDynamicImport } from '@src';

const pingMachine = createMachine({
  id: 'ping',
  invoke: {
    id: 'pong',
    src: () => fromDynamicImport(async () => (await import('./pong.machine')).pongMachine),
  },
  entry: send({ type: 'PING' }, { to: 'pong' }),
  initial: 'active',
  states: {
    active: {
      on: {
        PONG: {
          actions: [send({ type: 'PING' }, { to: 'pong', delay: 1000 }), () => console.log('PONG')],
        },
        STOP: 'complete',
      },
    },
    complete: {},
  },
});

(window as any).service = interpret(pingMachine).start();
