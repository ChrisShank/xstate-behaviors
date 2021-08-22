import { Event, EventObject, AnyEventObject, InvokeCreator, Subscription } from 'xstate';

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

/**
 * Create an invoked service for a event bus.
 * @param createEventBus Create a EventBus
 * @returns an invoke creator
 */
export function fromEventBus<TContext, TEvent extends EventObject = AnyEventObject>(
  createEventBus: (context: TContext, event: TEvent) => EventBus<TEvent>
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    const bus = createEventBus(context, event);

    const listener: Listener<TEvent> = (event) => {
      sendBack(event);
    };

    const subscription = bus.subscribe(listener);

    receive((event) => {
      bus.send(event, listener);
    });

    return () => {
      subscription.unsubscribe();
    };
  };
}
