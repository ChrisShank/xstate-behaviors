import { createMachine, sendParent, actions } from 'xstate';

const { log } = actions;

export const pongMachine = createMachine({
  id: 'pong',
  on: {
    PING: {
      actions: [log('PING'), sendParent('PONG', { delay: 1000 })],
    },
  },
});
