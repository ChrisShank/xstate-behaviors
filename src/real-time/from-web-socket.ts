import { AnyEventObject, EventObject, InvokeCallback } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromWebSocket<TEvent extends EventObject = AnyEventObject>(
  createSocket: () => WebSocket
): () => InvokeCallback<TEvent> {
  return () => (sendBack, receive) => {
    const socket = createSocket();

    socket.addEventListener('message', (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    });

    socket.addEventListener('error', (event) => {
      sendBack({ type: 'error', data: event });
    });

    receive((event) => {
      socket.send(JSON.stringify(event));
    });

    return () => {
      socket.close();
    };
  };
}
