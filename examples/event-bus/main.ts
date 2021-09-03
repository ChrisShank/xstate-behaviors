import { createMachine, interpret, send } from 'xstate';
import { log } from 'xstate/lib/actions';
import { EventBus, fromEventBus } from '@src';

type Context = {
  eventBus: EventBus;
};

const pongMachine = createMachine<Context>({
  id: 'pong',
  invoke: {
    id: 'event bus',
    src: fromEventBus((context) => context.eventBus),
  },
  on: {
    PONG: {
      actions: [log('PONG'), send({ type: 'PING' }, { to: 'event bus', delay: 1000 })],
    },
  },
});

const pingMachine = createMachine<Context>({
  id: 'ping',
  invoke: {
    id: 'event bus',
    src: fromEventBus((context) => context.eventBus),
  },
  on: {
    PING: {
      actions: [log('PING'), send({ type: 'PONG' }, { to: 'event bus', delay: 1000 })],
    },
  },
});

const parentMachine = createMachine<Context>({
  id: 'parent',
  context: {
    eventBus: new EventBus('EV'),
  },
  invoke: [
    { id: 'ping', src: pingMachine, data: (context) => context },
    { id: 'pong', src: pongMachine, data: (context) => context },
  ],
  entry: send({ type: 'PING' }, { to: 'ping' }),
});

const service = interpret(parentMachine).start();
