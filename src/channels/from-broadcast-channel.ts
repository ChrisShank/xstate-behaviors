import { EventObject, AnyEventObject, InvokeCreator } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

/**
 * Create an invoked service for a BroadcastChannel.
 * @param createBroadcastChannel Create a BroadcastChannel
 * @returns an invoke creator
 */
export function fromBroadcastChannel<TContext, TEvent extends EventObject = AnyEventObject>(
  createBroadcastChannel: (context: TContext, event: TEvent) => BroadcastChannel
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    const channel = createBroadcastChannel(context, event);

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
