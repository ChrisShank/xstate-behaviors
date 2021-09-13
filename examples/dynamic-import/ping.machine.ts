import { createMachine, sendParent, actions } from 'xstate';

const { log } = actions;

export const pingMachine = createMachine({
  id: 'ping',
  on: {
    PING: {
      actions: [log('PING'), sendParent('PONG', { delay: 1000 })],
    },
  },
});
