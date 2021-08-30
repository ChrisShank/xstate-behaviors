import { AnyEventObject, EventObject, InvokeCreator } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromWebSocket<TContext, TEvent extends EventObject = AnyEventObject>(
  createSocket: (context: TContext, event: TEvent) => WebSocket
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    const socket = createSocket(context, event);

    socket.addEventListener('message', (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        const data = JSON.parse(event.data);
        getEventType(data);
        sendBack(data);
      } catch {}
    });

    // TODO
    // socket.addEventListener('error', (event) => {
    //   sendBack({ type: 'error', data: event });
    // });

    receive((event) => {
      socket.send(JSON.stringify(event));
    });

    return () => {
      socket.close();
    };
  };
}
