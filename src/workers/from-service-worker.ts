import { AnyEventObject, EventObject, InvokeCallback } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromServiceWorker<
  TEvent extends EventObject = AnyEventObject
>(): () => InvokeCallback<TEvent> {
  return () => (sendBack, receive) => {
    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };
    navigator.serviceWorker.addEventListener('message', handler);

    receive((event) => {
      navigator.serviceWorker.controller?.postMessage(event);
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  };
}
