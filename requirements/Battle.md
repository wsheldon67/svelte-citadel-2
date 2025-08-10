# Battle

The main game loop of Citadel consists of players taking an action on their turn.

# Common Actions

## Place a Piece

Place a piece, adjacent to a Citdel you control.

- Typically this means the piece is placed on a Land tile, but some pieces (such as Turtles) are place in the water, and a non-Turtle piece can be placed on a Turtle.
- Pieces are placed either from the player's Personal Stash, or from the Community Pool.
- Pieces placed from the Community Pool become owned by the player that placed them.
- Pieces cannot typically capture as a part of being placed.

## Move a Piece

Each piece moves in a unique way.

## Capture

Pieces often capture by moving onto another piece, but there are exceptions. Captured pieces are sent to the Graveyard.

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

# General Rules

## Citadels Must be Connected

Citadels must be placed such that they are connected by Land tiles that are orthagonally adjacent. Any action that would cause the existing Citadels to become disconnected is not allowed.

## Winning

In a standard, two-player game, the game ends when a Citadel is captured. The player whose Citadel remains is the winner.