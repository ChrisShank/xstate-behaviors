import { createMachine, sendParent } from 'xstate';
import { interpretInWebWorker } from '../../src/workers/from-web-worker';

const pongMachine = createMachine({
  id: 'pong',
  on: {
    PING: {
      actions: [sendParent('PONG', { delay: 1000 }), () => console.log('PING')],
    },
  },
});

const service = interpretInWebWorker(pongMachine);
service.start();
