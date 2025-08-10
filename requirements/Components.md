# Board

In the phyiscal game, it's a flat surface like a table.

An infinite 2d grid.

# Terrain

## Land

Pices are typically placed on top of Land.

- Only 1 Land per coordinate
- In the physical game, wooden Land tokens placed directly on the table.

## Water

The "empty" area. Lands and Turtles go in it.

- Theoretically there is an infinite amount of water, it's any place on the infinite board where there is not Land.
- In the physical game, Water is represented by a lack of Land tokens.
- In the physical game, this is typically an empty space, but a Turtle can also be said to be "in the water."


# Citadel

In a standard game, each of the two players has 1 Citadel.
- Pieces are placed adjacent to the player's Citadel.
- When a player's Citadel is captured, that player loses the game.
- All Citadels in the game must be connected by orthagonally adjacent Land tiles.

# Pieces

Generally, pieces are placed on top of the Land/Turtle layer. The obvious exception is Turtles, which like Land, are placed in Water.

## Bird

Movement: The Bird moves in a straight line, either horizontally or vertically, for as many tiles as you want. It cannot move diagonally.

Capture: The Bird can capture any piece it lands on during its move.

## Soldier

Movement: The Knight moves one square at a time, either orthogonally (up, down, left, right) or diagonally.

Capture: The Knight captures any piece it lands on during its move.

## Turtle

Movement: The Turtle moves one square at a time, and can move diagonally or orthogonally.

Capture: The Turtle can attack pieces on land tiles that are orthogonally to it. It can also attack anything on its back.

Carrying Pieces: The Turtle can carry one piece at a time on its back. When a piece is carried, it moves with the Turtle when it moves. A player must use a turn to get a piece onto the Turtle’s back.

Edge Cases: 
- The Turtle functions as an adjacent tile for the Citadel to place new pieces onto. 
- The Turtle functions as a land tile for the purpose of connecting the 2 Citadels with straight lines.

## Rabbit

Movement: The Rabbit can move either one or two squares at a time, but the two-square move involves jumping over the middle square. The Rabbit can jump over water spaces.

Capture: The Rabbit can only capture pieces (or the opponent’s Citadel) by jumping on them (moving 2 squares). The Rabbit cannot capture by moving 1 square at a time.

## Builder

Movement: The Builder moves one square at a time, orthogonally (up, down, left, right). It cannot move diagonally.

Land Tile Movement: The Builder can move land tiles that are orthogonal to it to new positions that are orthogonal to that land tile’s position.

Land Tile Removal: The Builder can remove land tiles that are orthogonal to it. Any piece that was on that land tile is sent to the Graveyard, and the land tile itself is sent to the community pool.

Land Tile Placement: The Builder can place tiles from the community pool onto a water space. The tile must be placed orthogonally to the Builder. If that piece is placed on an occupied water space, any pieces on that space are sent to the Graveyard.

Capture: The builder can only capture by placing or moving land tiles onto a piece, or by, removing land tiles from underneath a piece
Edge Cases: If the Builder removes the tile it itself occupies, the Builder goes to the Graveyard, and the land tile is placed into the community pool.

## Bomber

Movement: The Bomber moves one square at a time, orthogonally (up, down, left, right).

Capture: The Bomber can capture any piece orthogonally adjacent to it.
Sacrifice Ability:

The Bomber can sacrifice itself to send any adjacent or diagonally adjacent pieces to the Graveyard. This includes the opponent’s Citadel, so if the Bomber is in range of the opponent’s Citadel, it will also be destroyed.

If another Bomber is within range when the Bomber activates its sacrifice, that Bomber also sacrifices itself. This functions as a chain reaction.
The Bomber cannot sacrifice itself if it’s in range of its own Citadel, as doing so would cause the player to lose the game.

## Necromancer

Movement: The Necromancer moves one square at a time, orthogonally (up, down, left, right).

Capture: The Necromancer can capture any piece orthogonally adjacent to it.

Special Ability:
The Necromancer can resurrect pieces from the Graveyard. On a turn, the player can replace the Necromancer with any piece from the Graveyard, and the Necromancer returns to its starting position (either in the community pool or the player's private stash).

## Assassin

Movement: The Assassin moves one square at a time, orthogonally (up, down, left, right).

Movement Through Connected Pieces: The Assassin can move through connected pieces—pieces that are either orthogonally or diagonally adjacent to each other—during its turn. The Assassin moves through these pieces, without capturing them.
- The Assassin can move across the board in one turn, provided that the pieces are connected in a continuous path.

Capture: Upon placement on the board, the player declares a specific piece controlled by their opponent as the Assassin’s target. The target is the only piece the Assassin is allowed to capture. When that piece is captured, the Assassin declares a new target.
