import { createMachine, sendParent, actions } from 'xstate';
import { interpretInWebWorker } from '@src';

const { log } = actions;

const pongMachine = createMachine({
  id: 'pong',
  on: {
    PING: {
      actions: [log('PING'), sendParent('PONG', { delay: 1000 })],
    },
  },
});

const service = interpretInWebWorker(pongMachine);
service.start();
