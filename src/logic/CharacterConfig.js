export const CHARACTERS = [
  {
    id: "maicha",
    name: "Maicha",
    textureKey: "player-girl",
    idleFrame: "0",
    frameStart: 1,
    frameEnd: 11,
    previewScale: 0.26,
    sourceHeight: 400,
  },
  {
    id: "baucha",
    name: "Baucha",
    textureKey: "player-boy",
    idleFrame: 0,
    frameStart: 1,
    frameEnd: 11,
    previewScale: 0.42,
    sourceHeight: 250,
    unlockCost: 200,
  },
];

const DEFAULT_CHARACTER = CHARACTERS[0];

export function getCharacterConfig(id) {
  return CHARACTERS.find((character) => character.id === id) || DEFAULT_CHARACTER;
}

export function getCharacterCellScale(character, cellSize, cellScale = 1.1) {
  return (cellSize * cellScale) / character.sourceHeight;
}

export function createCharacterWalkAnimation(scene, character, animationKey) {
  if (scene.anims.exists(animationKey)) {
    scene.anims.remove(animationKey);
  }

  const frames =
    character.textureKey === "player-girl"
      ? scene.anims.generateFrameNames(character.textureKey, {
          start: character.frameStart,
          end: character.frameEnd,
        })
      : scene.anims.generateFrameNumbers(character.textureKey, {
          start: character.frameStart,
          end: character.frameEnd,
        });

  scene.anims.create({
    key: animationKey,
    frames,
    frameRate: 10,
    repeat: -1,
  });
}
