import { EventObject, AnyEventObject, InvokeCreator } from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromAudioWorklet<TContext, TEvent extends EventObject = AnyEventObject>(
  createAudioWorkletNode: (context: TContext, event: TEvent) => AudioWorkletNode
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    const node = createAudioWorkletNode(context, event);

    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };

    node.port.addEventListener('message', handler);

    receive(({ _transfer, ...event }) => {
      node.port.postMessage(event, { transfer: _transfer });
    });

    return () => {
      node.port.removeEventListener('message', handler);
      node.port.close();
    };
  };
}
