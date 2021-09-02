import { createMachine, interpret, send, actions } from 'xstate';
import { fromWebWorker } from '@src';

const { log } = actions;

type Context = {
  buffer: ArrayBuffer;
};

const pongMachine = createMachine<Context>({
  id: 'pong',
  context: {
    buffer: new ArrayBuffer(8),
  },
  invoke: {
    id: 'pong',
    src: () =>
      fromWebWorker(() => new Worker(new URL('./worker', import.meta.url), { type: 'module' })),
  },
  entry: [
    log((ctx) => ctx.buffer.byteLength, 'Before transfer from main:'),
    send(({ buffer }) => ({ type: 'PING', buffer, _transfer: [buffer] }), { to: 'ping' }),
    // For some reason logging the buffer length will print 8, but the reference to the buffer shows that it was transferred
    log((ctx) => ctx.buffer, 'After transfer from main:'),
  ],
  on: {
    PONG: { actions: log((_, e) => e.buffer.byteLength, 'After transfer from worker: ') },
  },
});

const service = interpret(pongMachine).start();
