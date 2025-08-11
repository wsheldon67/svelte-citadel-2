import { describe, it, expect, beforeEach } from 'vitest';
import { LandPlace } from './LandPlace.js';
import { Land } from '../pieces/Land.js';
import { Coordinate } from '../engine/Coordinate.js';
import { RuleViolation } from '../engine/RuleViolation.js';

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
    
    // Mock game state with basic methods
    mockGameState = {
      board: new Map(),
      hasTerrain: (coord) => false,
      hasPiece: (coord) => false,
      setTerrain: (coord, piece) => {},
      setPiece: (coord, piece) => {},
      copy: () => ({ ...mockGameState })
    };
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
      
      // Should not throw for first piece
      expect(() => {
        landPlace.check(target, mockGameState, mockGameState);
      }).not.toThrow();
    });

    it('should prevent placement where terrain already exists', () => {
      const target = new Coordinate(0, 0);
      
      // Mock terrain existing at target
      mockGameState.hasTerrain = (coord) => coord.x === 0 && coord.y === 0;
      
      expect(() => {
        landPlace.check(target, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
    });

    it('should prevent placement where piece already exists', () => {
      const target = new Coordinate(0, 0);
      
      // Mock piece existing at target
      mockGameState.hasPiece = (coord) => coord.x === 0 && coord.y === 0;
      
      expect(() => {
        landPlace.check(target, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
    });

    it('should require adjacency to existing terrain (after first piece)', () => {
      const target = new Coordinate(5, 5); // Far from any terrain
      
      // Mock existing terrain at (0,0)
      mockGameState.board.set('0,0', { 
        terrain: { coordinate: new Coordinate(0, 0) }
      });
      
      expect(() => {
        landPlace.check(target, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
      expect(() => {
        landPlace.check(target, mockGameState, mockGameState);
      }).toThrow(/adjacent to existing terrain/);
    });

    it('should allow placement adjacent to existing terrain', () => {
      const target = new Coordinate(1, 0); // Adjacent to (0,0)
      
      // Mock existing terrain at (0,0)
      mockGameState.board.set('0,0', { 
        terrain: { coordinate: new Coordinate(0, 0) }
      });
      
      // Mock the adjacency check
      landPlace.isAdjacentToAnyTerrain = () => true;
      
      expect(() => {
        landPlace.check(target, mockGameState, mockGameState);
      }).not.toThrow();
    });

    it('should reject non-Land pieces', () => {
      const nonLandPiece = { type: 'Bird', owner: 'player1' };
      const nonLandPlace = new LandPlace(nonLandPiece);
      const target = new Coordinate(0, 0);
      
      expect(() => {
        nonLandPlace.check(target, mockGameState, mockGameState);
      }).toThrow(RuleViolation);
      expect(() => {
        nonLandPlace.check(target, mockGameState, mockGameState);
      }).toThrow(/LandPlace action can only be used with Land pieces/);
    });
  });

  describe('hasAnyTerrainOnBoard', () => {
    it('should return false when no terrain exists', () => {
      expect(landPlace.hasAnyTerrainOnBoard(mockGameState)).toBe(false);
    });

    it('should return true when terrain exists', () => {
      mockGameState.board.set('0,0', { 
        terrain: { coordinate: new Coordinate(0, 0) }
      });
      
      expect(landPlace.hasAnyTerrainOnBoard(mockGameState)).toBe(true);
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
      
      expect(landPlace.isAdjacentToAnyTerrain(target, mockGameState)).toBe(false);
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
      
      expect(landPlace.isAdjacentToAnyTerrain(target, mockGameState)).toBe(true);
    });
  });

  describe('perform', () => {
    it('should place the Land piece in terrain layer', () => {
      const target = new Coordinate(0, 0);
      let placedPiece = null;
      let placedCoord = null;
      
      // Mock setTerrain to capture placement
      mockGameState.setTerrain = (coord, piece) => {
        placedCoord = coord;
        placedPiece = piece;
      };
      
      // Mock piece copy
      land.copy = () => {
        const copy = new Land({ owner: land.owner, id: land.id });
        copy._setCoordinate = (coord) => copy._coordinate = coord;
        return copy;
      };
      
      landPlace.perform(target, mockGameState);
      
      expect(placedCoord).toBe(target);
      expect(placedPiece).toBeDefined();
      expect(placedPiece.type).toBe('Land');
    });
  });

  describe('getValidTargets', () => {
    it('should return grid around origin for first piece', () => {
      const targets = landPlace.getValidTargets(mockGameState);
      
      expect(targets.length).toBeGreaterThan(0);
      // Should include origin
      expect(targets.some(coord => coord.x === 0 && coord.y === 0)).toBe(true);
    });

    it('should return adjacent coordinates when terrain exists', () => {
      // Mock existing terrain at (0,0)
      mockGameState.board.set('0,0', { 
        terrain: { coordinate: new Coordinate(0, 0) }
      });
      
      // Mock Coordinate.getAllAdjacent
      const mockCoord = new Coordinate(0, 0);
      mockCoord.getAllAdjacent = () => [
        new Coordinate(1, 0),
        new Coordinate(-1, 0),
        new Coordinate(0, 1),
        new Coordinate(0, -1)
      ];
      
      // Replace the terrain coordinate with our mock
      mockGameState.board.set('0,0', { 
        terrain: { coordinate: mockCoord }
      });
      
      const targets = landPlace.getValidTargets(mockGameState);
      
      expect(targets.length).toBe(4); // Four adjacent coordinates
      expect(targets.some(coord => coord.x === 1 && coord.y === 0)).toBe(true);
      expect(targets.some(coord => coord.x === -1 && coord.y === 0)).toBe(true);
      expect(targets.some(coord => coord.x === 0 && coord.y === 1)).toBe(true);
      expect(targets.some(coord => coord.x === 0 && coord.y === -1)).toBe(true);
    });
  });

  describe('getDescription', () => {
    it('should return descriptive string', () => {
      expect(landPlace.getDescription()).toBe('Place Land (adjacent to existing terrain)');
    });
  });
});
