import Phaser from "phaser";
import colors from "../styles/colors.js";
import ProgressManager from "../logic/ProgressManager.js";
import { CHARACTERS } from "../logic/CharacterConfig.js";

const CARD_WIDTH = 180;
const CARD_HEIGHT = 210;
const BAUCHA_COST = 200;

export default class CharacterSelectionScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectionScene");
  }

  create() {
    this.cx = this.scale.width / 2;
    this.cy = this.scale.height / 2;
    this.selected = ProgressManager.getSelectedCharacter();

    this._drawExpBar();

    this.add
      .text(this.cx, this.cy - 170, "SELECT CHARACTER", {
        fontFamily: "EarlyGameBoy",
        fontSize: "30px",
        color: colors.light,
        align: "center",
        stroke: colors.dark,
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this._createCards();
    this._createPlayButton();
  }

  _createCards() {
    if (this.cardGroup) this.cardGroup.destroy(true);
    this.cardGroup = this.add.group();

    const spacing = Math.min(260, Math.max(210, this.scale.width * 0.28));
    const startX = this.cx - spacing / 2;
    const cardY = this.cy - 10;

    CHARACTERS.forEach((character, index) => {
      const x = startX + index * spacing;
      const isUnlocked = ProgressManager.isCharacterUnlocked(character.id);
      const isSelected = this.selected === character.id;

      this._createCharacterCard({
        character,
        x,
        y: cardY,
        isUnlocked,
        isSelected,
      });
    });
  }

  _createCharacterCard({ character, x, y, isUnlocked, isSelected }) {
    const shadow = this.add.rectangle(x + 8, y + 8, CARD_WIDTH, CARD_HEIGHT, colors.deepNum, 0.75);
    const bg = this.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, colors.darkNum);
    const inner = this.add.rectangle(x, y, CARD_WIDTH - 12, CARD_HEIGHT - 12, 0x3b2210);
    const border = this.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT);
    const topHighlight = this.add.rectangle(x, y - CARD_HEIGHT / 2 + 8, CARD_WIDTH - 22, 4, colors.controlsNum);

    border.setStrokeStyle(isSelected ? 6 : 4, isSelected ? colors.lightNum : colors.controlsNum);
    this.cardGroup.addMultiple([shadow, bg, inner, border, topHighlight]);

    const sprite = this.add
      .sprite(x, y - 34, character.textureKey, character.idleFrame)
      .setScale(character.previewScale);
    this.cardGroup.add(sprite);

    if (!isUnlocked) {
      sprite.setTint(0x303030);
      const veil = this.add.rectangle(x, y - 34, 104, 108, colors.deepNum, 0.45);
      const lockBadge = this.add.rectangle(x, y - 34, 76, 38, colors.deepNum, 0.9);
      const lockText = this.add
        .text(x, y - 34, "LOCK", {
          fontFamily: "EarlyGameBoy",
          fontSize: "12px",
          color: colors.light,
        })
        .setOrigin(0.5);
      this.cardGroup.addMultiple([veil, lockBadge, lockText]);
    }

    const nameText = this.add
      .text(x, y + 68, character.name, {
        fontFamily: "EarlyGameBoy",
        fontSize: "15px",
        color: colors.light,
        stroke: colors.deep,
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const statusText = this.add
      .text(x, y + 95, this._getStatusText(character, isUnlocked, isSelected), {
        fontFamily: "EarlyGameBoy",
        fontSize: "9px",
        color: isSelected ? "#ffffff" : colors.accent,
        align: "center",
      })
      .setOrigin(0.5);

    this.cardGroup.addMultiple([nameText, statusText]);

    border.setInteractive({ useHandCursor: true });
    border.on("pointerdown", () => {
      if (!isUnlocked) return;
      ProgressManager.selectCharacter(character.id);
      this.selected = character.id;
      this._createCards();
    });

    if (!isUnlocked) {
      this._createUnlockButton(character, x, y + 142);
    }
  }

  _getStatusText(character, isUnlocked, isSelected) {
    if (isUnlocked) return isSelected ? "SELECTED" : "READY";
    return `COST ${character.unlockCost || BAUCHA_COST} EXP`;
  }

  _createUnlockButton(character, x, y) {
    const cost = character.unlockCost || BAUCHA_COST;
    const canUnlock = ProgressManager.getXP() >= cost;
    const btnBg = this.add.rectangle(x, y, 162, 38, canUnlock ? colors.panelNum : colors.darkNum);
    const btnText = this.add
      .text(x, y, canUnlock ? "UNLOCK\n(200 EXP)" : "LOCKED", {
        fontFamily: "EarlyGameBoy",
        fontSize: "10px",
        color: colors.light,
        align: "center",
      })
      .setOrigin(0.5);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerdown", () => {
      if (ProgressManager.deductXP(cost)) {
        ProgressManager.unlockCharacter(character.id);
        ProgressManager.selectCharacter(character.id);
        this.selected = character.id;
        this._drawExpBar();
        this._createCards();
        return;
      }

      this.tweens.add({
        targets: btnText,
        x: x + 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
      btnText.setColor("#ff7a7a");
      this.time.delayedCall(500, () => btnText.setColor(colors.light));
    });

    this.cardGroup.addMultiple([btnBg, btnText]);
  }

  _createPlayButton() {
    const nextLevel = ProgressManager.getNextLevel();
    const y = this.cy + 205;

    const playShadow = this.add.rectangle(this.cx + 6, y + 6, 210, 58, colors.deepNum);
    const playBody = this.add.rectangle(this.cx, y, 210, 58, colors.darkNum);
    const playInner = this.add.rectangle(this.cx, y, 202, 50, colors.deepNum);
    const playText = this.add
      .text(this.cx, y, "PLAY >>>", {
        fontFamily: "EarlyGameBoy",
        fontSize: "18px",
        color: colors.light,
        align: "center",
      })
      .setOrigin(0.5);

    playShadow.setDepth(1);
    playBody.setDepth(2);
    playInner.setDepth(3);
    playText.setDepth(4);

    playBody.setInteractive({ useHandCursor: true });
    playBody.on("pointerdown", () => {
      this.scene.start("LevelIntroScene", { level: nextLevel });
    });
    playBody.on("pointerover", () => playBody.setScale(1.04));
    playBody.on("pointerout", () => playBody.setScale(1));

    this.input.keyboard?.once("keydown-ENTER", () => {
      this.scene.start("LevelIntroScene", { level: nextLevel });
    });
  }

  _drawExpBar() {
    if (this.expGroup) this.expGroup.destroy(true);
    this.expGroup = this.add.group();

    const currentXP = ProgressManager.getXP();
    const maxXP = ProgressManager.getMaxXP();
    const fillRatio = Math.min(currentXP / maxXP, 1);
    const barX = 16;
    const barY = 14;
    const barWidth = 220;
    const barHeight = 30;
    const borderSize = 4;
    const pixelSize = 4;
    const g = this.add.graphics();

    g.setDepth(100);
    g.fillStyle(0x1a0d05, 1);
    g.fillRect(barX - borderSize, barY - borderSize, barWidth + borderSize * 2, barHeight + borderSize * 2);
    g.fillStyle(0x3b2210, 1);
    g.fillRect(barX - borderSize / 2, barY - borderSize / 2, barWidth + borderSize, barHeight + borderSize);
    g.fillStyle(0x2b1708, 1);
    g.fillRect(barX, barY, barWidth, barHeight);

    const fillWidth = Math.floor((barWidth * fillRatio) / pixelSize) * pixelSize;

    for (let x = 0; x < fillWidth; x += pixelSize) {
      for (let y = 0; y < barHeight; y += pixelSize) {
        const xProgress = fillWidth ? x / fillWidth : 0;
        const yProgress = y / barHeight;
        const red = yProgress < 0.3 ? 0x9a + Math.floor(xProgress * 0x15) : 0x7a;
        const green = yProgress < 0.3 ? 0x6a + Math.floor(xProgress * 0x10) : 0x4f;
        const blue = yProgress < 0.3 ? 0x3e + Math.floor(xProgress * 0x0a) : 0x2a;
        g.fillStyle((red << 16) | (green << 8) | blue, 1);
        g.fillRect(barX + x, barY + y, pixelSize, pixelSize);
      }
    }

    const expLabel = this.add
      .text(barX + 8, barY + barHeight / 2, "EXP", {
        fontFamily: "EarlyGameBoy",
        fontSize: "14px",
        color: colors.light,
        stroke: colors.deep,
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setDepth(101);

    const expValue = this.add
      .text(barX + barWidth - 8, barY + barHeight / 2, `${currentXP}/${maxXP}`, {
        fontFamily: "EarlyGameBoy",
        fontSize: "11px",
        color: colors.light,
        stroke: colors.deep,
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5)
      .setDepth(101);

    this.expGroup.addMultiple([g, expLabel, expValue]);
  }
}
