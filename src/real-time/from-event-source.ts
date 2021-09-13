import { Behavior, EventObject } from 'xstate';
import { error } from 'xstate/lib/actions';
import { getEventType } from 'xstate/lib/utils';

type EventSourceEvents<T extends EventObject> =
  | { type: 'connected' }
  | { type: 'message'; data: T }
  | { type: 'error'; error: any };

type EventSourceState<T extends EventObject> =
  | { status: 'connecting' }
  | { status: 'open'; message?: T | undefined }
  | { status: 'error'; error: any }
  | { status: 'closed' };

export function fromEventSource<TEvent extends EventObject>(
  createEventSource: () => EventSource
): Behavior<EventSourceEvents<TEvent>, EventSourceState<TEvent>> {
  const initialState: EventSourceState<TEvent> = { status: 'connecting' };

  let eventSource: EventSource | undefined;
  let onOpen: () => void;
  let onMessage: (event: MessageEvent<string>) => void;
  let onError: (event: Event) => void;

  return {
    initialState,
    start({ self }) {
      eventSource = createEventSource();

      onOpen = () => self.send({ type: 'connected' });
      eventSource.addEventListener('open', onOpen);

      onMessage = (event) => {
        try {
          // Assert that the event sent over the web socket is a valid event
          // Will error if not
          const data: TEvent = JSON.parse(event.data);
          getEventType(data);
          self.send({ type: 'message', data });
        } catch {}
      };
      eventSource.addEventListener('message', onMessage);

      return initialState;
    },
    transition(state, event, { parent, id }) {
      switch (event.type) {
        case 'connected':
          parent?.send('connected');
          return { status: 'open' };
        case 'message':
          parent?.send(event.data);
          return { status: 'open', message: event.data };
        case 'error':
          parent?.send(error(id, event.error));
          return { status: 'error', error: event.error };
        default:
          return state;
      }
    },
    stop() {
      eventSource?.removeEventListener('open', onOpen);
      eventSource?.removeEventListener('message', onMessage);
      eventSource?.removeEventListener('error', onError);

      eventSource?.close();

      return { status: 'closed' };
    },
  };
}
