import { createMachine, interpret, send } from 'xstate';
import { log } from 'xstate/lib/actions';
import { fromBroadcastChannel } from '@src';

const BROADCAST_CHANNEL_NAME = 'BC';

const pingMachine = createMachine({
  id: 'ping',
  invoke: {
    id: 'event bus',
    src: fromBroadcastChannel(() => new BroadcastChannel(BROADCAST_CHANNEL_NAME)),
  },
  on: {
    PONG: {
      actions: [log('PONG'), send({ type: 'PING' }, { to: 'event bus', delay: 1000 })],
    },
  },
});

const pongMachine = createMachine({
  id: 'pong',
  invoke: {
    id: 'event bus',
    src: fromBroadcastChannel(() => new BroadcastChannel(BROADCAST_CHANNEL_NAME)),
  },
  on: {
    PING: {
      actions: [log('PING'), send({ type: 'PONG' }, { to: 'event bus', delay: 1000 })],
    },
  },
});

const parentMachine = createMachine({
  id: 'parent',
  invoke: [
    { id: 'ping', src: pingMachine },
    { id: 'pong', src: pongMachine },
  ],
  entry: send({ type: 'PING' }, { to: 'pong' }),
});

const service = interpret(parentMachine).start();
