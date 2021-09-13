import { ActorRef, Behavior, EventObject, Subscription } from 'xstate';

type ActorRefEvents<TEmitted> = { type: 'update'; state: TEmitted };

// What does it mean to subscribe to an actor?
// If the actor is a machine then why would you subscribe to its state?
// Other actors might makes sense to subscribe to though!
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
