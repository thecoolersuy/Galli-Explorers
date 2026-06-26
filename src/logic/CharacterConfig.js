export const CHARACTERS = [
  {
    id: "maicha",
    name: "Maicha",
    textureKey: "player-girl",
    frameType: "atlas",
    idleFrame: "0",
    frameStart: 1,
    frameEnd: 11,
    previewHeight: 150,
    previewOffsetY: 52,
    sourceWidth: 230,
    sourceHeight: 400,
    bodyHeight: 400,
    originX: 0.5,
    originY: 1,
  },
  {
    id: "baucha",
    name: "Baucha",
    textureKey: "player-boy",
    frameType: "spritesheet",
    idleFrame: 0,
    frameStart: 0,
    frameEnd: 8,
    frameWidth: 230,
    frameHeight: 724,
    previewHeight: 150,
    previewOffsetY: 52,
    sourceWidth: 230,
    sourceHeight: 724,
    bodyHeight: 240,
    originX: 0.5,
    originY: 0.675,
    unlockCost: 200,
  },
];

const DEFAULT_CHARACTER = CHARACTERS[0];

export function getCharacterConfig(id) {
  return CHARACTERS.find((character) => character.id === id) || DEFAULT_CHARACTER;
}

export function getCharacterCellScale(character, cellSize, cellScale = 1.1) {
  return getCharacterScaleForHeight(character, cellSize * cellScale);
}

export function getCharacterScaleForHeight(character, targetHeight) {
  return targetHeight / (character.bodyHeight || character.sourceHeight || character.frameHeight);
}

export function getCharacterPreviewScale(character) {
  return getCharacterScaleForHeight(character, character.previewHeight || 150);
}

export function applyCharacterSpriteLayout(sprite, character, scale) {
  return sprite
    .setOrigin(character.originX ?? 0.5, character.originY ?? 1)
    .setScale(scale);
}

export function getCharacterRenderPosition(character, cellCenterX, cellCenterY, cellSize) {
  const groundY = cellCenterY + cellSize / 2;

  return {
    x: cellCenterX,
    y: groundY,
  };
}

export function createCharacterWalkAnimation(scene, character, animationKey) {
  if (scene.anims.exists(animationKey)) {
    scene.anims.remove(animationKey);
  }

  const frameConfig = {
    start: character.frameStart,
    end: character.frameEnd,
  };

  const frames = character.frameType === "spritesheet"
    ? scene.anims.generateFrameNumbers(character.textureKey, frameConfig)
    : scene.anims.generateFrameNames(character.textureKey, frameConfig);

  scene.anims.create({
    key: animationKey,
    frames,
    frameRate: 12,
    repeat: -1,
  });
}
