# Game Engine (Copy-and-Test Design)
- [ ] Design and implement core game state structure (deep copyable)
- [ ] Create action-based state management system (initial state + actions list)
    * Only initial state and actions are persisted/transmitted by the server.
    * The current game state can (and generally should) always be derived from the initial state and the actions that were taken.
- [ ] Implement game engine with `isSimulation` flag to prevent recursive validation
- [ ] Add state copying functionality for "what-if" scenarios
- [ ] Implement piece authoring API (intuitive for beginners and LLMs)
- [ ] Implement base `Piece` class with flexible action system
    * Provides utilties useful when defining actions.
- [ ] Create extendable, pluggable action classes (`Move`, `Capture`, `Place`, custom actions)
    * BirdMove extends Move
    * Move class provides utilties useful for Move subclasses
- [ ] Add comprehensive rule validation system (`RuleViolation` exceptions)
    * RuleViolations should be thrown when an invalid action is taken
    * RuleViolations will be caught when checking an action's validity (implemented later, in the UI)
- [ ] Design game variant system from the ground up
    * It should be easy to extend the base class to override game rules using a compatible API.
    * It does not have to be as dumbed-down as the Piece authoring API