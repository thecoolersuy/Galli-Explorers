import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import Level1Scene from "./scenes/Level1Scene.js";
import Level2Scene from "./scenes/Level2Scene.js";
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
  scene: [BootScene, MenuScene, Level1Scene, Level2Scene, UIScene],
};

new Phaser.Game(config);
