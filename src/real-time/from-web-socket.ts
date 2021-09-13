import { Behavior, EventObject } from 'xstate';
import { doneInvoke, error } from 'xstate/lib/actions';
import { getEventType } from 'xstate/lib/utils';

type CloseError = { code: number; reason?: string; wasClean?: boolean };

type WebSocketEvents<T extends EventObject> =
  | { type: 'connected' }
  | { type: 'message'; data: T }
  | ({ type: 'close' } & CloseError)
  | { type: 'error'; error: any };

type WebSocketState<T extends EventObject> =
  | { status: 'connecting' }
  | { status: 'open'; message?: T | undefined }
  | { status: 'error'; error: any }
  | { status: 'closed'; close: CloseError };

export function fromWebSocket<TEvent extends EventObject>(
  createSocket: () => WebSocket
): Behavior<WebSocketEvents<TEvent>, WebSocketState<TEvent>> {
  const initialState: WebSocketState<TEvent> = { status: 'connecting' };
  const pendingEvents: TEvent[] = [];
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
        case 'connected': {
          socket?.send(JSON.stringify(pendingEvents));
          return { status: 'open' };
        }
        case 'message': {
          parent?.send(event.data);
          return { status: 'open', message: event.data };
        }
        case 'error': {
          parent?.send(error(id, event.error));
          return { status: 'error', error: event.error };
        }
        case 'close': {
          parent?.send(doneInvoke(id, event));
          const { code, reason, wasClean } = event;
          return { status: 'closed', close: { code, reason, wasClean } };
        }
        default: {
          if (state.status === 'connecting') {
            pendingEvents.push(event);
          } else if (state.status === 'open') {
            socket?.send(JSON.stringify(event));
          }
          return state;
        }
      }
    },
    stop() {
      socket?.removeEventListener('open', onOpen);
      socket?.removeEventListener('message', onMessage);
      socket?.removeEventListener('error', onError);
      socket?.removeEventListener('close', onClose);
      socket?.close(1001);

      return {
        status: 'closed',
        close: { code: 1001 },
      };
    },
  };
}
