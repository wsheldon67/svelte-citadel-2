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