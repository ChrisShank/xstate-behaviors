import {
  interpret,
  AnyInterpreter,
  StateMachine,
  InterpreterFrom,
  AnyEventObject,
  EventObject,
  StateSchema,
  InvokeCreator,
} from 'xstate';

/**
 * Create an invoked machine that is dynamically imported.
 * @param loadMachine Dynamically import a machine
 * @returns an invoke creator
 */
export function fromDynamicImport<
  TContext,
  TEvent extends EventObject = AnyEventObject,
  Machine extends StateMachine<any, any, any, any> = StateMachine<
    TContext,
    StateSchema<any>,
    TEvent,
    any
  >
>(
  loadMachine: (context: TContext, event: TEvent) => Promise<Machine>
): InvokeCreator<TContext, TEvent> {
  return (context, event) => (sendBack, receive) => {
    let service: InterpreterFrom<Machine> | null = null;
    let status: 'pending' | 'resolved' | 'rejected' | 'stopped' = 'pending';
    const pendingMessages: AnyEventObject[] = [];

    loadMachine(context, event)
      .then((machine) => {
        if (status === 'stopped') return;

        status = 'resolved';
        service = interpret(machine, {
          parent: { send: sendBack } as AnyInterpreter,
        }) as InterpreterFrom<Machine>;
        service?.send(pendingMessages);
      })
      .catch(() => (status = 'rejected'));

    receive((event) => {
      if (status === 'pending') {
        pendingMessages.push(event);
      } else if (status === 'resolved' && service) {
        service?.send(event);
      }
    });

    return () => {
      status = 'stopped';
      service?.stop();
    };
  };
}
