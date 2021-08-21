import { AnyEventObject, EventObject, InvokeCreator } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromEventSource<TContext, TEvent extends EventObject = AnyEventObject>(
  createEventSource: (context: TContext, event: TEvent) => EventSource
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack) => {
    const eventSource = createEventSource(context, event);

    eventSource.addEventListener('message', (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    });

    // TODO
    // eventSource.addEventListener('error', (event) => {
    //   sendBack({ type: 'error', data: event });
    // });

    return () => {
      eventSource.close();
    };
  };
}
