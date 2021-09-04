# xstate-behaviors

> Making web workers, web sockets, WebRTC, and other web-based APIs first-class actors in `xstate`.

_This package is not yet release as it is in a very early alpha state. If you would like to use any of these helpers now its recommended to copy and paste them into your codebase for the time being!_

If you have any ideas for other Web APIs to support please file an issue!

## Helper functions

Any of the helper functions exported from this library can be used to invoke or spawn an actor that wraps around a certain Web API.

### Async

- `fromDynamicImport`
  - Invoke/spawn a machine that is dynamically imported. Events sent to the machine while the dynamic import are loading are deferred until the machine is started.

### Workers

_It is assumed that events sent to/from the worker are of the type `EventObject`, otherwise they are ignored._

- `fromWebWorker`
  - Invoke/spawn a web worker.
  - `interpretInWebWorker`
    - Interpret a machine inside a web worker whose _parent_ is on the main thread. This means that you can use `sendParent` in your machine to send events out of the web worker.
- `fromSharedWorker`
  - Invoke/spawn a shared worker.
  - `interpretInSharedWorker`
    - Interpret a machine inside a shared worker whose _parent_ is on a main thread. This means that you can use `sendParent` in your machine to send events out of the web worker.
- `fromServiceWorker`
  - Invoke/spawn an actor that lets you communicate with a service worker. It is assumed that events sent from the worker are of the type `EventObject`.
- `fromAudioWorklet`
  - Invoke/spawn a `AudioWorklet`.

### Real-time

_It is assumed that events sent over the network are of the type `EventObject`, otherwise they are ignored._

- `fromWebSocket`
  - Invoke/spawn a web socket.
- `fromEventSource`
  - Invoke/spawn a event source for server side events.
- `fromWebRTC` (TODO)
  - Still figuring this out let me know if you have any idea!

### Events

- `fromEventBus`
  - Invoke/spawn an event bus so non-hierarchical actors can communicate
  - `EventBus` is a class that encapsulates an event bus. This is not a web API.
- `fromBroadCastChannel`
- Invoke/spawn a `BroadcastChannel` to communicate with anyone else listening
- `fromEventListener`
  - Invoke/spawn an event from
- `fromPostMessage` (TODO)
- `fromMessageChannel` (TODO)

## TODO

- [ ] Finish building out planned helpers.
- [ ] Add ability to filter out unwanted events.
- [ ] Add more tests/examples.
- [ ] Build out documentation.
