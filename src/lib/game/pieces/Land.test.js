import { describe, it, expect, beforeEach } from 'vitest';
import { Land } from './Land.js';
import { LandPlace } from '../actions/LandPlace.js';
import { GameState } from '../engine/GameState.js';
import { Coordinate } from '../engine/Coordinate.js';
import { Piece } from './Piece.js';

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

  describe('canBePlacedAt', () => {
    it('should allow placement in water (empty space)', () => {
      const coordinate = new Coordinate(0, 0);
      expect(land.canBePlacedAt(coordinate, gameState)).toBe(true);
    });

    it('should not allow placement where terrain already exists', () => {
      const coordinate = new Coordinate(0, 0);
      const existingLand = new Land({ owner: 'neutral' });
      gameState.setTerrain(coordinate, existingLand);
      
      expect(land.canBePlacedAt(coordinate, gameState)).toBe(false);
    });

    it('should allow placement even if a piece is present (pieces go on top of terrain)', () => {
      const coordinate = new Coordinate(0, 0);
      const piece = new Piece({ type: 'TestPiece', owner: 'player1' });
      gameState.setPiece(coordinate, piece);
      
      // Land can still be placed because it goes under pieces, not on top
      expect(land.canBePlacedAt(coordinate, gameState)).toBe(true);
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
