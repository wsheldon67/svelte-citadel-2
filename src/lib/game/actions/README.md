# Actions

Pieces can support an arbitrary number of actions. Some actions, especially Placement and Capturing, have functionality that is common to all pieces, but may differ in what targets are valid.

# Piece Authoring

It is paramount that the design of this program make it as easy as possible to code new Pieces.
- The API for coding a piece should be intuitive to both entry-level programmers, and to LLMs.

Pieces can support an arbitrary number of actions. Some actions, especially Placement and Capturing, have functionality that is common to all pieces, but may differ in what targets are valid.


```js
class Bird extends Piece {
  actions = [

    class BirdMove extends Move {
      /**
       * Check if the target is a valid move for the Bird.
       * @param target - The target tile to check.
       * @param current_game - The current game state.
       * @param new_game - The new game state after the move.
       */
      check(target, current_game, new_game): void {
        // Checks if there's a piece at the target, and if there's an entity on the layer below it
        super.check(target, current_game, new_game);
        if (!this.piece.is_orthagonal_to(target, { gaps_allowed: false })) {
          throw new RuleViolation(`Bird can only move to orthagonal tiles`);
        }
      }

      /**
       * Perform the move action.
       * @param target - The target tile to move to.
       * @param current_game - The current game state.
       */
      perform(target, current_game) {
        // Move the piece to the target tile
        super.perform(target, current_game);
      }
    }
  ]
}
```

# Unusual Actions

## Builder

The Builder piece can move, remove, and place Land tiles.
- A naive approach where a player clicks a piece they own and then a target tile to take an action on is broken by this. The player needs to select a Land and then where to move it to.

## Turtle

The Turtle is placed in water instead of Land, and can carry other pieces on its back.
- When the Turtle moves, the piece on the turtle moves too.
- A Turtle can carry friendly or enemy pieces.

## Bomber

When a Bomber explodes, it sets off other nearby Bombers in a chain reaction.

## Assassin

Assassins can move through an unlimited number of connected pieces without capturing them.

## Necromancer

The Necromancer can replace itself with a piece from the Graveyard. That piece becomes owned by the player who owned the Necromancer.