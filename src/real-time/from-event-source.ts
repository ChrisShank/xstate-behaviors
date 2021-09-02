import { Behavior, EventObject } from 'xstate';
import { error } from 'xstate/lib/actions';
import { getEventType } from 'xstate/lib/utils';

type EventSourceEvents<T extends EventObject> =
  | { type: 'connected' }
  | { type: 'message'; data: T }
  | ({ type: 'close' } & Pick<CloseEvent, 'code' | 'reason' | 'wasClean'>)
  | { type: 'error'; error: unknown };

type EventSourceState<T extends EventObject> =
  | {
      status: 'connecting';
      message: undefined;
      error: undefined;
      close: undefined;
    }
  | {
      status: 'open';
      message: T | undefined;
      error: undefined;
      close: undefined;
    }
  | {
      status: 'error';
      message: undefined;
      error: any;
      close: undefined;
    }
  | {
      status: 'closed';
      message: undefined;
      error: undefined;
    };

export function fromEventSource<TEvent extends EventObject>(
  createEventSource: () => EventSource
): Behavior<EventSourceEvents<TEvent>, EventSourceState<TEvent>> {
  const initialState: EventSourceState<TEvent> = {
    status: 'connecting',
    message: undefined,
    error: undefined,
    close: undefined,
  };

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
          return {
            status: 'open',
            message: undefined,
            error: undefined,
            close: undefined,
          };
        case 'message':
          parent?.send(event.data);
          return {
            status: 'open',
            message: event.data,
            error: undefined,
            close: undefined,
          };
        case 'error':
          parent?.send(error(id, event.error));
          return {
            status: 'error',
            message: undefined,
            error: event.error,
            close: undefined,
          };
        default:
          return state;
      }
    },
    stop() {
      eventSource?.removeEventListener('open', onOpen);
      eventSource?.removeEventListener('message', onMessage);
      eventSource?.removeEventListener('error', onError);

      eventSource?.close();

      return {
        status: 'closed',
        message: undefined,
        error: undefined,
      };
    },
  };
}
