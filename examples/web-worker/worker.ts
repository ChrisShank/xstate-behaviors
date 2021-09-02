import { createMachine, sendParent, actions } from 'xstate';
import { interpretInWebWorker } from '@src';

const { log } = actions;

const pingMachine = createMachine({
  id: 'ping',
  on: {
    PING: {
      actions: [log('PING'), sendParent('PONG', { delay: 1000 })],
    },
  },
});

const service = interpretInWebWorker(pingMachine);
service.start();
