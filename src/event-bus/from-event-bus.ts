import { Event, EventObject, AnyEventObject, InvokeCreator } from 'xstate';

type Listener<TEvent extends EventObject> = (event: Event<TEvent>) => void;

export class EventBus<TEvent extends EventObject = AnyEventObject> {
  state: 'running' | 'stopped' = 'running';
  listeners: Set<Listener<TEvent>> = new Set();

  constructor(readonly id: string) {}

  protected get isStopped() {
    return this.state === 'stopped';
  }

  subscribe(listener: Listener<TEvent>) {
    if (this.isStopped) return;

    this.listeners.add(listener);
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

    bus.subscribe(listener);

    receive((event) => {
      bus.send(event, listener);
    });

    return () => {
      bus.stop();
    };
  };
}
