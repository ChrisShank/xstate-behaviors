import { AnyEventObject, EventObject, InvokeCallback } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromEventSource<TEvent extends EventObject = AnyEventObject>(
  createEventSource: () => EventSource
): () => InvokeCallback<TEvent> {
  return () => (sendBack) => {
    const eventSource = createEventSource();

    eventSource.addEventListener('message', (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    });

    eventSource.addEventListener('error', (event) => {
      sendBack({ type: 'error', data: event });
    });

    return () => {
      eventSource.close();
    };
  };
}
