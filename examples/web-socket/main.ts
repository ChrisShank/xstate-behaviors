import { createMachine, interpret, send } from 'xstate';
import { fromWebSocket } from '@src';

const pingMachine = createMachine({
  id: 'ping',
  invoke: {
    id: 'pong',
    src: fromWebSocket(() => new WebSocket('')),
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

const service = interpret(pingMachine).start();
