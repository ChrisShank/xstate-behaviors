import { AnyEventObject, EventObject, InvokeCallback } from 'xstate';

export function fromEventListener<
  E extends keyof WindowEventMap,
  TEvent extends EventObject = AnyEventObject
>(eventName: E): () => InvokeCallback<TEvent> {
  return () => (sendBack) => {
    addEventListener(eventName, sendBack);
    return () => {
      removeEventListener(eventName, sendBack);
    };
  };
}
