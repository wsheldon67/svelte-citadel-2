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
- [x] Implement base `Piece` class with flexible action system
- [x] Create pluggable action classes (`Move`, `Capture`, `Place`, custom actions)
- [x] Add comprehensive rule validation system (`RuleViolation` exceptions)
- [ ] Design game variant system from the ground up

### Data Models (Extensible Architecture)
- [x] Create `Board` class (infinite 2D grid with variant support)
- [x] Implement `Land` tile system with custom properties
- [x] Create `Water` space handling with piece interactions
- [ ] Design `Citadel` class with variant-specific rules and connectivity
- [x] Implement flexible player management system (2+ players, teams)
- [x] Create `Graveyard` and dynamic piece pools (Personal/Community/Variant-specific)
- [x] Design piece property system for complex interactions

---

## 🎮 Game Flow Implementation

### Setup & Lobby
- [ ] Create game setup screen with configuration options
  - [ ] Lands per player setting
  - [ ] Personal pieces per player setting  
  - [ ] Community pieces per player setting
- [ ] Implement lobby system with game codes
- [ ] Add player invitation and joining functionality
- [ ] Create "Start Game" button for host

### Game Phases
- [ ] **Land Placement Phase**
  - [ ] Interactive land tile placement
  - [ ] Citadel placement with connectivity validation
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
- [ ] Create responsive game board component
- [ ] Implement tile highlighting system
- [ ] Add piece selection and action preview
- [ ] Create floating action menus for complex pieces
- [ ] Implement drag-and-drop functionality (optional)

### UI Components
- [ ] Design game board layout component
- [ ] Create piece selection panels
- [ ] Implement action confirmation dialogs
- [ ] Add game status indicators
- [ ] Create player turn indicators
- [ ] Design graveyard and pools display

### Visual Design
- [ ] Create default art assets for all pieces
- [ ] Implement custom art upload system
- [ ] Add art set selection in lobby
- [ ] Design cohesive visual theme

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
- [ ] Set up Firebase project and configuration
- [ ] Implement real-time game state synchronization
- [ ] Add player connection/disconnection handling
- [ ] Create game session management
- [ ] Implement lobby real-time updates

### Data Storage
- [ ] Design game state schema
- [x] Implement action history storage
- [x] Add game state serialization (JSON) for save/load functionality
- [x] Create game recreation from serialized data with action replay
- [ ] Add user account system (anonymous + upgrade)
- [ ] Create custom art asset storage
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

### Integration Testing
- [ ] Test multiplayer synchronization
- [ ] Test Firebase integration
- [ ] Test UI interactions
- [ ] Test piece authoring API

### End-to-End Testing (Playwright)
- [ ] Complete game flow testing
- [ ] Multi-player game scenarios
- [ ] Error handling and edge cases

---

## 🎯 Game Variants (Core Architecture)

### Fundamental Variant System
- [ ] Design pluggable game mode architecture
- [ ] Create variant-specific rule injection system
- [ ] Implement dynamic win condition system
- [ ] Design flexible player/team configuration

### Initial Target Variants (Implement Early)
- [ ] **Standard 2-Player Citadel Capture**
  - [ ] Traditional citadel-based win condition
  - [ ] Land connectivity requirements
  - [ ] Standard piece placement rules
  
- [ ] **Conquest Mode**
  - [ ] Neutral territory tiles
  - [ ] Territory control win conditions  
  - [ ] Modified piece placement rules
  - [ ] Area control mechanics

### Extended Variants (After Core System)
- [ ] **No Citadel Mode**: Piece elimination victory
- [ ] **Defender Mode**: Asymmetric gameplay (1 citadel vs attackers)
- [ ] **Team Modes**: 4-player team variants
- [ ] **Multiple Citadel**: Per-player/team citadel variants

## 🔧 Extensibility & Architecture

### Core Extensibility Systems
- [ ] Plugin system for custom pieces with validation
- [ ] Custom game rule definition language/API
- [ ] Mod support framework with sandboxing
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
*Status: Core Game Engine Complete with Action History - Phase 1 Implementation Done*
*Progress: ✅ Game engine with copy-and-test design implemented ✅ Basic pieces (Bird, Soldier) working ✅ Full test suite passing ✅ Action history and game serialization complete ✅ Game state recreation from serialized data working*
*Next: Implement complex pieces (Builder, Turtle, Bomber) and game variants*
