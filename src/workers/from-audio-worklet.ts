import { EventObject, AnyEventObject, InvokeCallback } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromAudioWorklet<TEvent extends EventObject = AnyEventObject>(
  createAudioWorkletNode: () => AudioWorkletNode
): () => InvokeCallback<TEvent> {
  return () => (sendBack, receive) => {
    const node = createAudioWorkletNode();

    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };

    node.port.addEventListener('message', handler);

    receive((event) => {
      node.port.postMessage(event);
    });

    return () => {
      node.port.removeEventListener('message', handler);
      node.port.close();
    };
  };
}
