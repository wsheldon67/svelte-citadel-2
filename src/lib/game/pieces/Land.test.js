import { describe, it, expect, beforeEach } from 'vitest';
import { Land } from './Land.js';
import { LandPlace } from './Land.js';
import { GameState } from '../engine/GameState.js';
import { Coordinate } from '../engine/Coordinate.js';
import { Piece } from './Piece.js';
import { RuleViolation } from '../engine/RuleViolation.js';

describe('Land', () => {
  /** @type {Land} */
  let land;
  /** @type {GameState} */
  let gameState;

  beforeEach(() => {
    land = new Land({ owner: 'neutral' });
    gameState = new GameState();
  });

  describe('constructor', () => {
    it('should create a Land piece with correct type', () => {
      expect(land.type).toBe('Land');
      expect(land.owner).toBe('neutral');
      expect(land.id).toBeDefined();
    });

    it('should create with custom owner', () => {
      const playerLand = new Land({ owner: 'player1' });
      expect(playerLand.owner).toBe('player1');
    });
  });

  describe('getActions', () => {
    it('should return LandPlace action', () => {
      const actions = land.getActions();
      expect(actions).toEqual([LandPlace]);
    });
  });

  describe('fromJSON', () => {
    it('should create Land from JSON data', () => {
      const data = {
        type: 'Land',
        owner: 'neutral',
        id: 'test-land-123'
      };

      const landFromJSON = Land.fromJSON(data);
      expect(landFromJSON.type).toBe('Land');
      expect(landFromJSON.owner).toBe('neutral');
      expect(landFromJSON.id).toBe('test-land-123');
    });
  });

  describe('placement validation using LandPlace action', () => {
    it('should allow placement in water (empty space)', () => {
      const coordinate = new Coordinate(0, 0);
      const landPlace = new LandPlace(land);
      const targetCell = gameState.getCell(coordinate);
      
      // Should not throw for valid placement
      expect(() => {
        landPlace.check(targetCell, gameState, gameState);
      }).not.toThrow();
    });

    it('should not allow placement where terrain already exists', () => {
      const coordinate = new Coordinate(0, 0);
      const existingLand = new Land({ owner: 'neutral' });
      gameState.setTerrain(coordinate, existingLand);
      
      const landPlace = new LandPlace(land);
      const targetCell = gameState.getCell(coordinate);
      
      expect(() => {
        landPlace.check(targetCell, gameState, gameState);
      }).toThrow(RuleViolation);
    });

    it('should not allow placement where piece already exists', () => {
      const coordinate = new Coordinate(0, 0);
      const piece = new Piece({ type: 'TestPiece', owner: 'player1' });
      gameState.setPiece(coordinate, piece);
      
      const landPlace = new LandPlace(land);
      const targetCell = gameState.getCell(coordinate);
      
      expect(() => {
        landPlace.check(targetCell, gameState, gameState);
      }).toThrow(RuleViolation);
    });
  });

  describe('isTerrain', () => {
    it('should return true (Land is terrain)', () => {
      expect(land.isTerrain()).toBe(true);
    });
  });

  describe('canSupportPieces', () => {
    it('should return true (pieces can be placed on Land)', () => {
      expect(land.canSupportPieces()).toBe(true);
    });
  });

  describe('integration with GameState', () => {
    it('should be placeable as terrain in GameState', () => {
      const coordinate = new Coordinate(1, 1);
      gameState.setTerrain(coordinate, land);
      
      expect(gameState.getTerrainAt(coordinate)).toBe(land);
      expect(gameState.hasTerrain(coordinate)).toBe(true);
    });

    it('should support pieces being placed on top', () => {
      const coordinate = new Coordinate(1, 1);
      const piece = new Piece({ type: 'TestPiece', owner: 'player1' });
      
      // Place land first
      gameState.setTerrain(coordinate, land);
      
      // Then place piece on top
      gameState.setPiece(coordinate, piece);
      
      expect(gameState.getTerrainAt(coordinate)).toBe(land);
      expect(gameState.getPieceAt(coordinate)).toBe(piece);
    });

    it('should enforce one Land per coordinate rule', () => {
      const coordinate = new Coordinate(2, 2);
      const secondLand = new Land({ owner: 'neutral' });
      
      // Place first land
      gameState.setTerrain(coordinate, land);
      expect(gameState.getTerrainAt(coordinate)).toBe(land);
      
      // Attempting to place second land replaces the first
      gameState.setTerrain(coordinate, secondLand);
      expect(gameState.getTerrainAt(coordinate)).toBe(secondLand);
      expect(gameState.getTerrainAt(coordinate)).not.toBe(land);
    });
  });
});


describe('LandPlace', () => {
  /** @type {Land} */
  let land;
  /** @type {LandPlace} */
  let landPlace;
  /** @type {import('../engine/GameState.js').GameState} */
  let mockGameState;

  beforeEach(() => {
    land = new Land({ owner: 'player1' });
    landPlace = new LandPlace(land);
    // Use a real GameState instance
    mockGameState = new (require('../engine/GameState.js').GameState)();
    mockGameState.hasPiece = (coord) => false;
    mockGameState.setTerrain = (coord, piece) => { };
    mockGameState.setPiece = (coord, piece) => { };
    mockGameState.copy = () => mockGameState; // For test, shallow copy is fine
  });

  describe('constructor', () => {
    it('should create a LandPlace action with a Land piece', () => {
      expect(landPlace.piece).toBe(land);
      expect(landPlace.name).toBe('LandPlace');
    });
  });

  describe('check', () => {
    it('should allow placement on empty water (first Land piece)', () => {
      const target = new Coordinate(0, 0);
      const targetCell = mockGameState.getCell(target);

      // Should not throw for first piece
      expect(() => {
        landPlace.check(targetCell, mockGameState, mockGameState);
      }).not.toThrow();
    });

    it('should prevent placement where terrain already exists', () => {
      const target = new Coordinate(0, 0);
      const targetCell = mockGameState.getCell(target);

      // Set terrain at the target location
      targetCell.setTerrain(new Land({ owner: 'player1' }));

      expect(() => {
        landPlace.check(targetCell, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
    });

    it('should prevent placement where piece already exists', () => {
      const target = new Coordinate(0, 0);
      const targetCell = mockGameState.getCell(target);

      // Set piece at the target location
      targetCell.setPiece(new Land({ owner: 'player1' }));

      expect(() => {
        landPlace.check(targetCell, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
    });

    it('should require adjacency to existing terrain (after first piece)', () => {
      const target = new Coordinate(5, 5); // Far from any terrain
      const targetCell = mockGameState.getCell(target);

      // Set existing terrain at (0,0) 
      const existingCoord = new Coordinate(0, 0);
      const existingCell = mockGameState.getCell(existingCoord);
      existingCell.setTerrain(new Land({ owner: 'player1' }));

      expect(() => {
        landPlace.check(targetCell, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
      expect(() => {
        landPlace.check(targetCell, mockGameState, mockGameState);
      }).toThrow(/adjacent to existing terrain/);
    });

    it('should allow placement adjacent to existing terrain', () => {
      const target = new Coordinate(1, 0); // Adjacent to (0,0)
      const targetCell = mockGameState.getCell(target);

      // Set existing terrain at (0,0)
      const existingCoord = new Coordinate(0, 0);
      const existingCell = mockGameState.getCell(existingCoord);
      existingCell.setTerrain(new Land({ owner: 'player1' }));

      expect(() => {
        landPlace.check(targetCell, mockGameState, mockGameState);
      }).not.toThrow();
    });
  });

  describe('hasAnyTerrainOnBoard', () => {
    it('should return false when no terrain exists', () => {
      expect(mockGameState.hasAnyTerrain()).toBe(false);
    });

    it('should return true when terrain exists', () => {
      // Set terrain at (0,0)
      const coord = new Coordinate(0, 0);
      const cell = mockGameState.getCell(coord);
      cell.setTerrain(new Land({ owner: 'player1' }));

      expect(mockGameState.hasAnyTerrain()).toBe(true);
    });
  });

  describe('isAdjacentToAnyTerrain', () => {
    it('should return false when no terrain is adjacent', () => {
      const target = new Coordinate(5, 5);

      // Mock getAllAdjacent to return specific coordinates
      target.getAllAdjacent = () => [
        new Coordinate(4, 5),
        new Coordinate(6, 5),
        new Coordinate(5, 4),
        new Coordinate(5, 6)
      ];

      expect(mockGameState.isAdjacentToAnyTerrain(target)).toBe(false);
    });

    it('should return true when terrain is adjacent', () => {
      const target = new Coordinate(1, 0);

      // Mock getAllAdjacent to return coordinates including (0,0)
      target.getAllAdjacent = () => [
        new Coordinate(0, 0), // This one has terrain
        new Coordinate(2, 0),
        new Coordinate(1, 1),
        new Coordinate(1, -1)
      ];

      // Mock terrain existing at (0,0)
      mockGameState.hasTerrain = (coord) => coord.x === 0 && coord.y === 0;

      expect(mockGameState.isAdjacentToAnyTerrain(target)).toBe(true);
    });
  });

  describe('perform', () => {
    it('should place the Land piece in terrain layer', () => {
      const target = new Coordinate(0, 0);
      const targetCell = mockGameState.getCell(target);
      
      // Track placement
      /** @type {import('../engine/Coordinate.js').Coordinate|null} */
      let placedCoord = null;
      /** @type {import('../pieces/Land.js').Land|null} */
      let placedPiece = null;

      // Mock setTerrain to capture placement
      const originalSetTerrain = mockGameState.setTerrain;
      mockGameState.setTerrain = (coord, piece) => {
        placedCoord = coord;
        placedPiece = /** @type {import('../pieces/Land.js').Land} */ (piece);
        originalSetTerrain.call(mockGameState, coord, piece);
      };

      landPlace.perform(targetCell, mockGameState);

      expect(placedCoord).toBe(target);
      expect(placedPiece).toBeDefined();
      if (placedPiece) {
        expect(/** @type {import('../pieces/Land.js').Land} */ (placedPiece).type).toBe('Land');
      }
      
      // Restore original method
      mockGameState.setTerrain = originalSetTerrain;
    });
  });

  describe('getDescription', () => {
    it('should return descriptive string', () => {
      expect(landPlace.getDescription()).toBe('Place Land (adjacent to existing terrain)');
    });
  });
});

