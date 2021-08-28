import { Behavior, EventObject } from 'xstate';
import { doneInvoke, error } from 'xstate/lib/actions';
import { getEventType } from 'xstate/lib/utils';

type WebSocketEvents<T extends EventObject> =
  | { type: 'connected' }
  | { type: 'message'; data: T }
  | ({ type: 'close' } & Pick<CloseEvent, 'code' | 'reason' | 'wasClean'>)
  | { type: 'error'; error: unknown };

type WebSocketState<T extends EventObject> =
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
      close: Pick<CloseEvent, 'code' | 'reason' | 'wasClean'>;
    };

export function fromWebSocket<TEvent extends EventObject>(
  createSocket: () => WebSocket
): Behavior<WebSocketEvents<TEvent>, WebSocketState<TEvent>> {
  const initialState: WebSocketState<TEvent> = {
    status: 'connecting',
    message: undefined,
    error: undefined,
    close: undefined,
  };

  let socket: WebSocket | undefined;
  let onOpen: () => void;
  let onMessage: (event: MessageEvent<string>) => void;
  let onError: (event: Event) => void;
  let onClose: (event: CloseEvent) => void;

  return {
    initialState,
    start({ self }) {
      socket = createSocket();

      onOpen = () => self.send({ type: 'connected' });
      socket.addEventListener('open', onOpen);

      onMessage = (event) => {
        try {
          // Assert that the event sent over the web socket is a valid event
          // Will error if not
          const data: TEvent = JSON.parse(event.data);
          getEventType(data);
          self.send({ type: 'message', data });
        } catch {}
      };
      socket.addEventListener('message', onMessage);

      onError = (event) => self.send({ type: 'error', error: event });
      socket.addEventListener('error', onError);

      onClose = ({ code, reason, wasClean }) =>
        self.send({ type: 'close', code, reason, wasClean });
      socket.addEventListener('close', onClose);

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
        case 'close':
          parent?.send(doneInvoke(id, event));
          const { code, reason, wasClean } = event;
          return {
            status: 'closed',
            message: undefined,
            error: undefined,
            close: { code, reason, wasClean },
          };
        default:
          socket?.send(JSON.stringify(event));
          return state;
      }
    },
    stop() {
      socket?.removeEventListener('open', onOpen);
      socket?.removeEventListener('message', onMessage);
      socket?.removeEventListener('error', onError);
      socket?.removeEventListener('close', onClose);

      return {
        status: 'closed',
        message: undefined,
        error: undefined,
        close: {
          code: 1000,
          reason: 'Normal closure',
          wasClean: true,
        },
      };
    },
  };
}
