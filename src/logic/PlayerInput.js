export const PLAYER_MOVE_MS = 280;

export function setupHeldKeyInput(scene) {
  scene.cursors = scene.input.keyboard.createCursorKeys();
  scene.wasd = scene.input.keyboard.addKeys("W,A,S,D");
  scene.lastMoveTime = 0;
  scene.heldMoveKey = null;
}

export function getHeldMoveKey(scene) {
  const { cursors, wasd } = scene;

  if (cursors?.up?.isDown || wasd?.W?.isDown) return "w";
  if (cursors?.down?.isDown || wasd?.S?.isDown) return "s";
  if (cursors?.left?.isDown || wasd?.A?.isDown) return "a";
  if (cursors?.right?.isDown || wasd?.D?.isDown) return "d";

  return null;
}

export function processHeldMovement(scene, time, handleMove, {
  setPlayerRunning,
  setPlayerIdle,
} = {}) {
  const key = getHeldMoveKey(scene);

  if (!key) {
    scene.heldMoveKey = null;
    if (scene.isPlayerMoving) {
      scene.isPlayerMoving = false;
      setPlayerIdle?.();
    }
    return;
  }

  if (key !== scene.heldMoveKey) {
    scene.heldMoveKey = key;
    scene.lastMoveTime = 0;
  }

  if (!scene.isPlayerMoving) {
    scene.isPlayerMoving = true;
    setPlayerRunning?.();
  }

  if (scene.lastMoveTime > 0 && time - scene.lastMoveTime < PLAYER_MOVE_MS) {
    return;
  }

  scene.lastMoveTime = time;
  handleMove(key);
}
