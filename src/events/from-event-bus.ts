import {
  Event,
  EventObject,
  AnyEventObject,
  InvokeCreator,
  Subscription,
  InvokeCallback,
  Behavior,
} from 'xstate';

type Listener<TEvent extends EventObject> = (event: Event<TEvent>) => void;

export class EventBus<TEvent extends EventObject = AnyEventObject> {
  state: 'running' | 'stopped' = 'running';
  listeners: Set<Listener<TEvent>> = new Set();

  constructor(readonly id: string) {}

  protected get isStopped() {
    return this.state === 'stopped';
  }

  subscribe(listener: Listener<TEvent>): Subscription {
    if (this.isStopped) return { unsubscribe: () => {} };

    this.listeners.add(listener);

    return {
      unsubscribe: () => this.listeners.delete(listener),
    };
  }

  send(event: Event<TEvent>, listenerToIgnore?: Listener<TEvent>) {
    if (this.isStopped) return;

    for (const listener of this.listeners) {
      if (listener !== listenerToIgnore) listener(event);
    }
  }

  stop() {
    if (this.isStopped) return;

    this.state = 'stopped';
    this.listeners.clear();
  }
}

export function fromEventBus<TEvent extends EventObject = AnyEventObject>(
  eventBus: EventBus<TEvent>
): Behavior<TEvent, any> {
  let listener: Listener<TEvent>;

  return {
    initialState: undefined,
    start({ self }) {
      listener = (event) => {
        self.send(event);
      };
      eventBus;
    },
    transition(state, event) {
      return undefined;
    },
    stop() {},
  };
  // return (sendBack, receive) => {
  //   const bus = createEventBus();

  //   const listener: Listener<TEvent> = (event) => {
  //     sendBack(event);
  //   };

  //   const subscription = bus.subscribe(listener);

  //   receive((event) => {
  //     bus.send(event, listener);
  //   });

  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // };
}
