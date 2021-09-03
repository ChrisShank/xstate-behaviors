import { ActorRef, Behavior, EventObject, Subscription } from 'xstate';

type ActorRefEvents<TEmitted> = { type: 'update'; state: TEmitted };

export function fromActor<TEvent extends EventObject, TEmitted>(
  actorRef: ActorRef<TEvent, TEmitted>
): Behavior<TEvent | ActorRefEvents<TEmitted>, TEmitted> {
  const initialState = actorRef.getSnapshot();

  let subscription: Subscription | undefined;

  return {
    initialState,
    start({ self }) {
      subscription = actorRef.subscribe((state) => {
        self.send({ type: 'update', state });
      });

      return initialState;
    },
    transition(state, event) {
      // type inference isn't working as expected :/
      if (event.type === 'update') {
        return (event as ActorRefEvents<TEmitted>).state;
      }

      actorRef.send(event as TEvent);
      return state;
    },
    stop() {
      subscription?.unsubscribe();
    },
  };
}
