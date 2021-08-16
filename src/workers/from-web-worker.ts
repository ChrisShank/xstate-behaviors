import {
  AnyEventObject,
  AnyInterpreter,
  DefaultContext,
  EventObject,
  interpret,
  InterpreterOptions,
  InvokeCallback,
  StateMachine,
  StateSchema,
  Typestate,
} from 'xstate';
import { getEventType } from 'xstate/lib/utils';

export function fromWebWorker<TEvent extends EventObject = AnyEventObject>(
  createWorker: () => Worker
): () => InvokeCallback<TEvent> {
  return () => (sendBack, receive) => {
    const worker = createWorker();
    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };
    worker.addEventListener('message', handler);

    receive((event) => {
      worker.postMessage(event);
    });

    return () => {
      worker.removeEventListener('message', handler);
      worker.terminate();
    };
  };
}

export function interpretInWebWorker<
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = { value: any; context: TContext }
>(
  machine: StateMachine<TContext, TStateSchema, TEvent, TTypestate>,
  options?: Partial<InterpreterOptions>
) {
  const _self = self as WorkerGlobalScope & typeof globalThis;

  const service = interpret(machine, {
    ...options,
    deferEvents: true,
    parent: {
      send: (event) => {
        _self.postMessage(event);
      },
    } as AnyInterpreter, // should probably be a different type
  });

  _self.addEventListener('message', (event: MessageEvent<TEvent>) => {
    try {
      // Will error out if the data is not a valid event
      getEventType(event.data);
      service.send(event.data);
    } catch {}
  });

  return service;
}
