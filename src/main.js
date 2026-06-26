import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import CharacterSelectionScene from "./scenes/CharacterSelectionScene.js";
import LevelIntroScene from "./scenes/LevelIntroScene.js";
import Level1Scene from "./scenes/Level1Scene.js";
import Level2Scene from "./scenes/Level2Scene.js";
import Level3Scene from "./scenes/Level3Scene.js";
import Level4Scene from "./scenes/Level4Scene.js";
import Level5Scene from "./scenes/Level5Scene.js";
import UIScene from "./scenes/UIScene.js";
import "./style.css";
import colors from "./styles/colors.js";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: colors.bg,
  pixelArt: true,
  roundPixels: true,
  scene: [
    BootScene,
    MenuScene,
    CharacterSelectionScene,
    LevelIntroScene,
    Level1Scene,
    Level2Scene,
    Level3Scene,
    Level4Scene,
    Level5Scene,
    UIScene,
  ],
};

new Phaser.Game(config);
