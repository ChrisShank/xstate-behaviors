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

export function fromSharedWorker<TEvent extends EventObject = AnyEventObject>(
  createWorker: () => SharedWorker
): () => InvokeCallback<TEvent> {
  return () => (sendBack, receive) => {
    const worker = createWorker();

    worker.port.start();

    const handler = (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        sendBack(event.data);
      } catch {}
    };

    worker.port.addEventListener('message', handler);

    receive((event) => {
      worker.port.postMessage(event);
    });

    return () => {
      worker.port.removeEventListener('message', handler);
      worker.port.close();
    };
  };
}

export function interpretInSharedWorker<
  TContext = DefaultContext,
  TStateSchema extends StateSchema = any,
  TEvent extends EventObject = EventObject,
  TTypestate extends Typestate<TContext> = { value: any; context: TContext }
>(
  machine: StateMachine<TContext, TStateSchema, TEvent, TTypestate>,
  options?: Partial<InterpreterOptions>
) {
  const _self = self as WorkerGlobalScope;

  const service = interpret(machine, {
    ...options,
    deferEvents: true,
    parent: {
      send: (event, payload) => {
        _self.postMessage({ type: event, ...payload });
      },
    } as AnyInterpreter, // should probably be a different type
  });

  _self.addEventListener('connect' as any, (event: MessageEvent) => {
    const [port] = event.ports;

    port.addEventListener('message', (event: MessageEvent<TEvent>) => {
      try {
        // Will error out if the data is not a valid event
        getEventType(event.data);
        service.send(event.data);
      } catch {}
    });
  });

  return service;
}
