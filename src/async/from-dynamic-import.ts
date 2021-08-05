import {
  interpret,
  AnyInterpreter,
  StateMachine,
  InvokeCallback,
  InterpreterFrom,
  EventObject,
  AnyEventObject,
} from 'xstate';

export function fromDynamicImport<Machine extends StateMachine<any, any, any>>(
  loadMachine: () => Promise<Machine>
): () => InvokeCallback {
  return () => (sendBack, receive) => {
    let service: InterpreterFrom<Machine> | null = null;
    let status: 'pending' | 'resolved' | 'rejected' | 'stopped' = 'pending';
    const pendingMessages: AnyEventObject[] = [];

    loadMachine()
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
