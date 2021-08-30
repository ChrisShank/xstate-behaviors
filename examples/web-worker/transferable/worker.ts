import { createMachine, sendParent, actions } from 'xstate';
import { interpretInWebWorker } from '@src';

const { log } = actions;

const pongMachine = createMachine({
  id: 'pong',
  on: {
    PING: {
      actions: [
        log((_, e) => e.buffer.byteLength, 'Before transfer from worker:'),
        sendParent((_, e) => ({ type: 'PONG', buffer: e.buffer, _transfer: [e.buffer] })),
        // For some reason logging the buffer length will print 8, but the reference to the buffer shows that it was transferred
        log((_, e) => e.buffer, 'After transfer from worker:'),
      ],
    },
  },
});

const service = interpretInWebWorker(pongMachine);
service.start();
