import { describe, it, expect, beforeEach } from 'vitest';

import { Builder, BuilderMove, BuilderMoveTerrain, BuilderRemoveTerrain, BuilderPlaceTerrain } from './Builder.js';
import { GameState } from '../engine/GameState.js';
import { Coordinate } from '../engine/Coordinate.js';
import { Piece } from './Piece.js';

describe('Builder', () => {
  /** @type {GameState} */
  let gameState;
  /** @type {Builder} */
  let builder;
  /** @type {Piece} */
  let landTile;

  beforeEach(() => {
    gameState = new GameState();
    gameState.addPlayer('player1');
    gameState.addPlayer('player2');

    builder = new Builder({ owner: 'player1' });
    landTile = new Piece({ type: 'Land', owner: 'neutral' });
  });

  describe('Basic Builder functionality', () => {
    it('should create Builder with correct type', () => {
      expect(builder.type).toBe('Builder');
      expect(builder.owner).toBe('player1');
    });

    it('should have all builder actions', () => {
      const actions = builder.getActions();
      expect(actions).toHaveLength(4);
      expect(actions).toContain(BuilderMove);
      expect(actions).toContain(BuilderMoveTerrain);
      expect(actions).toContain(BuilderRemoveTerrain);
      expect(actions).toContain(BuilderPlaceTerrain);
    });

    it('should serialize and deserialize correctly', () => {
      const json = builder.toJSON();
      const reconstructed = Builder.fromJSON(json);
      
      expect(reconstructed.type).toBe(builder.type);
      expect(reconstructed.owner).toBe(builder.owner);
      expect(reconstructed.id).toBe(builder.id);
    });
  });

  describe('BuilderMove', () => {
    it('should allow orthogonal movement', () => {
      const builderCoord = new Coordinate(0, 0);
      const targetCoord = new Coordinate(1, 0);
      
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);
      gameState.setTerrain(targetCoord, new Piece({ type: 'Land', owner: 'neutral' }));

      const move = new BuilderMove(builder);
      const targetCell = gameState.getCell(targetCoord);
      
      expect(() => {
        move.check(targetCell, gameState, gameState);
      }).not.toThrow();
    });

    it('should reject diagonal movement', () => {
      const builderCoord = new Coordinate(0, 0);
      const targetCoord = new Coordinate(1, 1);
      
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);

      const move = new BuilderMove(builder);
      const targetCell = gameState.getCell(targetCoord);
      
      expect(() => {
        move.check(targetCell, gameState, gameState);
      }).toThrow('Builder can only move to orthogonally adjacent squares');
    });
  });

  describe('BuilderPlaceTerrain', () => {
    it('should place terrain from community pool', () => {
      const builderCoord = new Coordinate(0, 0);
      const targetCoord = new Coordinate(1, 0);
      
      // Set up builder on land
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);
      
      // Add land to community pool
      const newLand = new Piece({ type: 'Land', owner: 'neutral' });
      gameState.addToCommunityPool(newLand);

      const action = new BuilderPlaceTerrain(builder);
      const targetCell = gameState.getCell(targetCoord);
      action.perform(targetCell, gameState);

  expect(gameState.hasTerrain(targetCoord)).toBe(true);
  const terrain = gameState.getTerrainAt(targetCoord);
  expect(terrain).not.toBeNull();
  expect(terrain?.type).toBe('Land');
      expect(gameState.communityPool).toHaveLength(0);
    });

    it('should capture piece on water when placing terrain', () => {
      const builderCoord = new Coordinate(0, 0);
      const targetCoord = new Coordinate(1, 0);
      const enemy = new Piece({ type: 'Soldier', owner: 'player2' });
      
      // Set up builder on land
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);
      
      // Place enemy on water
      gameState.setPiece(targetCoord, enemy);
      
      // Add land to community pool
      const newLand = new Piece({ type: 'Land', owner: 'neutral' });
      gameState.addToCommunityPool(newLand);

      const action = new BuilderPlaceTerrain(builder);
      const targetCell = gameState.getCell(targetCoord);
      action.perform(targetCell, gameState);

      expect(gameState.hasTerrain(targetCoord)).toBe(true);
      expect(gameState.getPieceAt(targetCoord)).toBeNull();
      expect(gameState.graveyard).toContain(enemy);
    });
  });

  describe('BuilderRemoveTerrain', () => {
    it('should remove terrain and send piece to graveyard', () => {
      const builderCoord = new Coordinate(0, 0);
      const targetCoord = new Coordinate(1, 0);
      const targetLand = new Piece({ type: 'Land', owner: 'neutral' });
      const enemy = new Piece({ type: 'Soldier', owner: 'player2' });
      
      // Set up builder on land
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);
      
      // Set up target with land and enemy
      gameState.setTerrain(targetCoord, targetLand);
      gameState.setPiece(targetCoord, enemy);

      const action = new BuilderRemoveTerrain(builder);
      const targetCell = gameState.getCell(targetCoord);
      action.perform(targetCell, gameState);

      expect(gameState.hasTerrain(targetCoord)).toBe(false);
      expect(gameState.getPieceAt(targetCoord)).toBeNull();
      expect(gameState.graveyard).toContain(enemy);
      expect(gameState.communityPool).toContain(targetLand);
    });

    it('should handle builder removing its own tile', () => {
      const builderCoord = new Coordinate(0, 0);
      
      // Set up builder on land
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);

      const action = new BuilderRemoveTerrain(builder);
      const builderCell = gameState.getCell(builderCoord);
      action.perform(builderCell, gameState);

      expect(gameState.hasTerrain(builderCoord)).toBe(false);
      expect(gameState.getPieceAt(builderCoord)).toBeNull();
      expect(gameState.graveyard).toContain(builder);
      expect(gameState.communityPool).toContain(landTile);
    });
  });

  describe('BuilderMoveTerrain', () => {
    it('should move terrain to adjacent position', () => {
      const builderCoord = new Coordinate(0, 0);
      const sourceCoord = new Coordinate(1, 0);
      const targetCoord = new Coordinate(2, 0);
      const movableLand = new Piece({ type: 'Land', owner: 'neutral' });
      
      // Set up builder on land
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);
      
      // Set up source terrain
      gameState.setTerrain(sourceCoord, movableLand);

      const action = new BuilderMoveTerrain(builder, sourceCoord);
      const targetCell = gameState.getCell(targetCoord);
      action.perform(targetCell, gameState);

      expect(gameState.hasTerrain(sourceCoord)).toBe(false);
      expect(gameState.hasTerrain(targetCoord)).toBe(true);
      expect(gameState.getTerrainAt(targetCoord)).toBe(movableLand);
    });

    it('should capture piece when moving terrain onto it', () => {
      const builderCoord = new Coordinate(0, 0);
      const sourceCoord = new Coordinate(1, 0);
      const targetCoord = new Coordinate(2, 0);
      const movableLand = new Piece({ type: 'Land', owner: 'neutral' });
      const enemy = new Piece({ type: 'Soldier', owner: 'player2' });
      
      // Set up builder on land
      gameState.setTerrain(builderCoord, landTile);
      gameState.setPiece(builderCoord, builder);
      
      // Set up source terrain
      gameState.setTerrain(sourceCoord, movableLand);
      
      // Set up target with enemy
      gameState.setPiece(targetCoord, enemy);

      const action = new BuilderMoveTerrain(builder, sourceCoord);
      const targetCell = gameState.getCell(targetCoord);
      action.perform(targetCell, gameState);

      expect(gameState.hasTerrain(targetCoord)).toBe(true);
      expect(gameState.getPieceAt(targetCoord)).toBeNull();
      expect(gameState.graveyard).toContain(enemy);
    });
  });
});
