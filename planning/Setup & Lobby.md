# Setup & Lobby

## Authentication

We'll start with firebase anonymous authentication. I want it to be painless and easy to join or start a game.

The home page should start out with ready-to-go forms for starting or joining a game.

Later, we'll add a button to login/upgrade an anonymous account.

## Create game setup screen with configuration options
- Lands per player setting
- Personal pieces per player setting  
- Community pieces per player setting
- Player display name
    * Use the name generator to provide default names for anonymous users
    * Players can change their display name per game that they start/join, it's not tied to their account.
    * Later, we'll use a default from their account if they're signed in, but it will still be editable when start or joining.
## Implement lobby system with game codes

Additional players are invited using a game code. They appear in a lobby to allow any small number of players to join.
One all players are in, the host presses a button to start the game.

## Add player invitation and joining functionality

Player should be able to join by link or by game code.