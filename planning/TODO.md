# Citadel Development To-Do List

*A comprehensive task breakdown for building the Citadel board game application*

## 🎯 Project Overview
- **Tech Stack**: SvelteKit 5, TypeScript (via JSDocs), Firebase, Vitest
- **Core Concept**: Multiplayer turn-based strategy game with wooden tile mechanics
- **Key Features**: Piece authoring system, real-time multiplayer, game simulation

---

## 🏗️ Core Architecture & Foundation

### Game Engine (Copy-and-Test Design)
- [x] Design and implement core game state structure (deep copyable)
- [x] Create action-based state management system (initial state + actions list)
- [x] Implement game engine with `isSimulation` flag to prevent recursive validation
- [x] Add state copying functionality for "what-if" scenarios
- [ ] Create undo/redo functionality
- [x] Design extensible piece authoring API (intuitive for beginners and LLMs)
- [x] **COMPLETED**: Simplified player management by storing both player IDs and display names directly in GameState, removing the need for separate playerNames mapping in Svelte components
- [x] Implement base `Piece` class with flexible action system
- [x] Create pluggable action classes (`Move`, `Capture`, `Place`, custom actions)
- [x] Add comprehensive rule validation system (`RuleViolation` exceptions)
- [x] Design game variant system from the ground up (Variant base, hooks, class-based availability)

### Data Models (Extensible Architecture)
- [x] Create `Board` class (infinite 2D grid with variant support)
- [x] Implement `Land` tile system with custom properties
- [x] Create `Water` space handling with piece interactions
- [x] Design `Citadel` class with variant-specific rules and connectivity
  - [x] Implement base `Citadel` piece (type + ownership; can be placed and captured)
  - [x] Enforce citadel connectivity validation in engine (path-finding)
- [x] Implement flexible player management system (2+ players, teams)
- [x] Create `Graveyard` and dynamic piece pools (Personal/Community/Variant-specific)
- [x] Design piece property system for complex interactions

---

## 🎮 Game Flow Implementation

### Setup & Lobby
- [x] Create game setup screen with configuration options
  - [x] Lands per player setting
  - [x] Personal pieces per player setting  
  - [x] Community pieces per player setting
  - [x] Player display name with generated default
- [x] Implement lobby system with game codes (create/join via URL + code)
- [x] Add player invitation and joining functionality (code and link)
- [x] Create "Start Game" button for host

### Game Phases
- [x] **Land Placement Phase**
  - [x] Interactive land tile placement
  - [x] Citadel placement with connectivity validation
- [ ] **Piece Selection Phase**
  - [ ] Personal stash piece selection
  - [ ] Community pool piece selection
- [ ] **Battle Phase** (main game loop)
  - [ ] Turn-based action system
  - [ ] Piece placement mechanics
  - [ ] Movement and capture system
  - [ ] Win condition detection
- [ ] **Summary Screen**
  - [ ] Winner display
  - [ ] Game statistics
  - [ ] New game options

---

## 🎨 User Interface & Experience

### Interactive Board
- [x] Create responsive game board component
- [x] Implement tile highlighting system
- [ ] Add piece selection and action preview
- [ ] Create floating action menus for complex pieces
- [ ] Implement drag-and-drop functionality (optional)

### UI Components
- [x] Design game board layout component
- [ ] Create piece selection panels
- [ ] Implement action confirmation dialogs
- [x] Add game status indicators
- [x] Create player turn indicators
- [ ] Design graveyard and pools display

### Visual Design
- [ ] Finalize default built-in art sets for all pieces (static assets in repo)
- [ ] Implement custom art upload system (user-provided sets stored in Firebase Storage)
- [ ] Add art set selection in lobby (unique per player + host-selected shared set)
- [ ] Design cohesive visual theme

#### Own Art System (Decision + Tasks)
- [x] Decision: Default/built-in art are static assets; user uploads live in Firebase Storage
- [x] Provide 7 built-in sets: 6 player sets (0–5) + 1 shared/unowned set
  - [x] Organize static art at `static/art/{setId}/{Piece}.png` (e.g., `0/Bird.png`)
  - [x] Add remaining built-in sets for all current pieces
- [x] Art resolver with fallback order
  - [x] Priority: player's selected user set → selected built-in set
  - [x] Unowned Pieces priority - set chosen for this purpose by host -> default unowned pieces set.
  - [ ] Cache/version strategy for static and uploaded assets
- [ ] Lobby UI behaviors
  - [ ] Enforce unique art set per player (disable taken sets)
  - [ ] Host selects the shared/unowned set
  - [ ] Live conflict resolution as players join/leave or change selection
- [ ] Upload pipeline for custom sets
  - [ ] Client validation (type/size), optional square crop/resize (64–512px)
  - [ ] Convert/store as PNG/WebP under `users/{uid}/artSets/{setId}/{Piece}.png`
  - [ ] Generate thumbnail/preview
- [ ] Metadata & persistence
  - [ ] Firestore: `users/{uid}/artSets/{setId}` (name, pieces present, thumbnail, createdBy)
  - [ ] Lobby/game: selected set per player + host-selected shared set id
- [ ] Security & access
  - [ ] Storage rules: owners write; reads limited to participants of active games using the set
  - [ ] Firestore rules to list only own sets (no public sharing initially)
- [ ] Performance & offline
  - [ ] Preload built-in sets used in current match; cache via Service Worker/SvelteKit
  - [ ] Use responsive image sizes and appropriate Cache-Control headers
- [ ] Testing
  - [ ] Unit tests for resolver fallback (missing piece, missing set, offline)
  - [ ] Integration tests for lobby uniqueness and host shared-set behavior

---

## ♟️ Complex Piece Implementation (Priority Focus)

### Advanced Interaction Pieces (Start Here)
- [ ] **Builder**: Land tile manipulation (move, place, remove) with complex UI interactions
- [ ] **Turtle**: Water placement, piece carrying system, connectivity rules
- [ ] **Bomber**: Sacrifice ability with chain reactions and citadel protection
- [ ] **Assassin**: Target declaration system, movement through connected pieces
- [ ] **Necromancer**: Graveyard resurrection with piece ownership transfer

### Standard Pieces (After Complex Ones)
- [x] **Bird**: Orthogonal line movement, capture on landing
- [x] **Soldier**: One square orthogonal/diagonal movement  
- [ ] **Rabbit**: 1-2 square movement, jump capture only

### Extended Pieces for Variants
- [ ] **Engineer**: Defense/blockade mechanics
- [ ] **Warlock**: Piece stealing abilities
- [ ] **Mind Control**: Opponent piece manipulation
- [ ] **Shapeshifter**: Dynamic piece transformation
- [ ] **Lich**: Resurrection with delay mechanics

### Complex Action Systems
- [ ] Builder land tile manipulation with multi-step UI
- [ ] Turtle carrying system and synchronized movement
- [ ] Bomber chain reaction calculation and prevention logic
- [ ] Assassin targeting system with dynamic target selection
- [ ] Necromancer replacement mechanics with ownership transfer
- [ ] Multi-action turn system for complex pieces
- [ ] Action preview and validation system

---

## 🔥 Firebase Integration

### Real-time Features
- [x] Set up Firebase project and configuration
- [x] Implement real-time game state synchronization
- [x] Create game session management
- [x] Implement lobby real-time updates (players array subscription)

### Data Storage
- [x] Design game state schema
- [x] Implement action history storage
- [x] Add game state serialization (JSON) for save/load functionality
- [x] Create game recreation from serialized data with action replay
- [ ] Add user account system (anonymous + upgrade)
  - [x] Anonymous auth for visitors
  - [ ] Upgrade/linked accounts
- [ ] Create custom art asset storage (Firebase Storage under `users/{uid}/artSets/...`)
- [ ] Firestore metadata for art sets (per-user, per-set), and lobby/game selection fields
- [ ] Firebase Storage rules for art sets: owner write; scoped read for match participants
- [ ] Firestore rules to restrict listing/editing art sets to owner
- [x] Add game replay functionality (action history based)

---

## 🧪 Testing & Quality Assurance

### Unit Testing (Vitest)
- [x] Set up comprehensive test suite
- [x] Test all piece movement rules
- [x] Test game state transitions
- [x] Test rule validation system
- [x] Test simulation engine
- [x] Test action history recording and serialization
- [x] Test game state recreation from serialized data
- [ ] Test action undo/redo functionality
 - [ ] Add dedicated server-only test script to avoid browser requirements locally
 - [x] UI tests: Create/Join navigation and LobbyView render/start callback
 - [ ] Test art resolver fallback matrix (user set missing piece, built-in missing, offline)
 - [ ] Test host-shared set selection behavior in resolver

### Integration Testing
- [ ] Test multiplayer synchronization
- [ ] Test Firebase integration
- [ ] Test UI interactions
- [ ] Test piece authoring API
 - [ ] Test lobby art set uniqueness enforcement and conflict resolution
 - [ ] Test custom set upload flow (validation, storage, metadata)

### End-to-End Testing (Playwright)
- [ ] Complete game flow testing
- [ ] Multi-player game scenarios
- [ ] Error handling and edge cases
 - [ ] E2E: create-and-join lobby flow asserts both players visible
 - [ ] Art set selection end-to-end: unique selection, host shared set, fallback rendering when assets missing

---

## 🎯 Game Variants (Core Architecture)

### Fundamental Variant System
- [x] Design pluggable game mode architecture
- [x] Create variant-specific rule injection system (Variant.checkEnd/onAction)
- [x] Implement dynamic win condition system (delegated to Variant)
- [x] Variant-driven piece availability (class-based only) + optional palette API
- [ ] Design flexible player/team configuration

### Initial Target Variants (Implement Early)
- [ ] **Standard 2-Player Citadel Capture**
  - [ ] Traditional citadel-based win condition
  - [ ] Land connectivity requirements
  - [ ] Standard piece placement rules

### Implemented Variants (Current)
- [x] Assassin (variant): Win immediately on first Citadel capture; also wins if only one player has Citadels
- [x] Last Man Standing (variant): Winner is the only remaining Citadel owner; draw if none remain

### Extended Variants (After Core System)
- [ ] **No Citadel Mode**: Piece elimination victory
- [ ] **Defender Mode**: Asymmetric gameplay (1 citadel vs attackers)
- [ ] **Team Modes**: 4-player team variants
- [ ] **Multiple Citadel**: Per-player/team citadel variants

## 🔧 Extensibility & Architecture

### Core Extensibility Systems
- [ ] Plugin system for custom pieces with validation
- [ ] Custom game rule definition language/API
- [ ] Dynamic piece property system
- [ ] Extensible action type system
- [ ] Variant-specific UI component injection

### Advanced Features
- [ ] Piece interaction effect system (buffs, debuffs, synergies)
- [ ] Dynamic board modification capabilities
- [ ] Custom win condition scripting
- [ ] Advanced AI/simulation hooks for piece decisions

---

## 📱 Polish & Deployment

### Performance
- [ ] Implement efficient state updates
- [ ] Add loading states and error handling

### Accessibility
- [ ] Add keyboard navigation
- [ ] Implement screen reader support
- [ ] Color-blind friendly design

### Deployment
- [ ] Set up production build pipeline
- [ ] Configure Firebase hosting
- [ ] Add error monitoring

---

## 🎲 Future Enhancements (Optional)

### Additional Pieces (from Variations.md)
- [ ] Engineer (defense/blockades)
- [ ] Tollman (immovable blocker)
- [ ] Warlock (piece stealing)
- [ ] Mind Control (opponent piece control)
- [ ] Leveling pieces (Werewolf)
- [ ] Buff/support pieces
- [ ] Stealth pieces
- [ ] Ghost, Banshee, Succubus, Lich
- [ ] Shapeshifter
- [ ] Teleporter pieces

### Game Modes
- [ ] No Citadel mode
- [ ] Capture the Flag
- [ ] Conquest (territory control)
- [ ] Defender mode
- [ ] 3+ player modes (Assassin, Teams, Last Man Standing)
- [ ] Portal/multi-board support

---

## 🔄 Development Approach

**Complexity-First Strategy**: Start with the most complex pieces and variant systems to ensure the architecture can handle advanced interactions from the beginning.

**Phase 1 (Complex Foundation)**: 
- Unified game engine with simulation context
- Builder, Turtle, Bomber, Assassin, Necromancer pieces
- Standard + Conquest game variants
- Extensible piece authoring system

**Phase 2 (Complete Core System)**: 
- Remaining standard pieces
- Firebase integration with action history
- Advanced UI for complex interactions
- Comprehensive testing framework

**Phase 3 (Extension & Polish)**: 
- Additional variants and pieces
- Custom art system
- Performance optimization
- Plugin/mod system

**Phase 4 (Advanced Features)**: 
- AI integration
- Tournament systems
- Advanced analytics
- Community features

---

*Last Updated: August 10, 2025*
*Status: Core engine complete; citadel placement phase implemented; Firebase lobby & game sessions online*
*Progress: ✅ Engine with copy-and-test design ✅ Basic pieces (Bird, Soldier, Citadel) ✅ Unit tests passing ✅ Action history & serialization ✅ Replay scaffold ✅ Variants (Assassin, Last Man Standing) ✅ Home UI with Create/Join ✅ Lobby with realtime players & Start button ✅ Land placement phase ✅ Citadel placement phase with player-specific art sets ✅ Interactive game board with highlighting ✅ Turn-based gameplay ✅ Game session management ✅ E2E smoke on Edge*
*Next: Piece selection phase, battle phase implementation, and remaining piece types*
