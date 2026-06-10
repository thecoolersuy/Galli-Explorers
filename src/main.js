import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import Level1Scene from "./scenes/Level1Scene.js";
import UIScene from "./scenes/UIScene.js";
import "./style.css";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#f1e8b6",
  scene: [BootScene, MenuScene, Level1Scene, UIScene],
};

new Phaser.Game(config);
