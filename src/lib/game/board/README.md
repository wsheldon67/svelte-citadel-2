# Board

In the phyiscal game, it's a flat surface like a table.

An infinite 2d grid.

# Layers

The game features 2 inherent layers (3 if you include water). There is a rule of 1 piece per layer.

## Water "Layer"

The "empty" area. Lands and Turtles go in it.

- Theoretically there is an infinite amount of water, it's any place on the infinite board where there is not Land.
- In the physical game, Water is represented by a lack of Land tokens.
- In the physical game, this is typically an empty space, but a Turtle can also be said to be "in the water."

## Terrain Layer

- Land and Turtles. Might include other things in the future.
- The terrain pieces go in the water.

## Piece Layer

- Most pieces, including Citadels.
- There must be something (Land, Turtle, etc.) in the Terrain layer to place a piece.

# General Rules

## Citadels Must be Connected

Citadels must be placed such that they are connected by Land tiles that are orthagonally adjacent. Any action that would cause the existing Citadels to become disconnected is not allowed.