import { EventObject, AnyEventObject, InvokeCallback } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromBroadcastChannel<TEvent extends EventObject = AnyEventObject>(
  createBroadcastChannel: () => BroadcastChannel
): () => InvokeCallback<TEvent> {
  return () => (sendBack, receive) => {
    const channel = createBroadcastChannel();

    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };

    channel.addEventListener('message', handler);

    receive((event) => {
      channel.postMessage(event);
    });

    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
    };
  };
}
