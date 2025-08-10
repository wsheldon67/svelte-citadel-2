# Piece Authoring

It is paramount that the design of this program make it as easy as possible to code new Pieces.
- The API for coding a piece should be intuitive to both entry-level programmers, and to LLMs.

Pieces can support an arbitrary number of actions. Some actions, especially Placement and Capturing, have functionality that is common to all pieces, but may differ in what targets are valid.

# Action UI

If a player clicks a Piece, the Tiles that piece can take actions on should be highlighted.

If a Piece is selected, clicking a highlighted tile should perform the action (if there is only and no other information is needed), or provide a floating menu to determine which action should be taken and how.
- The Builder is a particularly complicated example of this. A Builder can move a Land that is adjacent to it to another Tile.

# Game State

I would prefer the state to be derived from an intial state, combined with a list of actions taken. I'd love for the whole game to be reviewable, and for any action to be un-doable.

# Reactivity

The UI will need to update when new game state is received from the server, and when a player takes an action.

# Game Simulation

I need to be able to simulate a game without the UI attached, to determine the validity of some actions (such as the rule that no action may disconnect the Citadels).

The simulation does not need to be persisted in any way, it is only use to get information about the game state if an action were to be taken.

Care needs to be taken to avoid creating an infinite loop when a Piece is using the simulation to check the validity of a move. (Simulated Piece also spins up a simulation, which creates another copy of the simulated Piece, which spins up another simulation, etc.)

# Alternative Game Formats

It should be easy to write different game logic to allow for alternative game modes.
- The API for coding a piece should be intuitive to both entry-level programmers, and to LLMs.

Additional game modes could potentially include:
- Different win-conditions.
- Different numbers of allowed total players (including requiring an even number)
- Teams
- Multiple citadels per person or per team.
- Changed, added, or removed Pieces.

# Own Art

Players should be able to upload their own art to use for the pieces as an alternative to the default art sets. Players should be able to select which art set they want to use in the Lobby UI. No two players can have the same set.

The host should be able to choose the art set used for the shared pieces (any piece with no assigned controller).

# Account Upgrades

To retain their art, it should be easy to upgrade an account from an Anonymous user. (Firebase)