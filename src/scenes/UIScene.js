import Phaser from "phaser";
import colors from "../styles/colors.js";
import { formatElapsedTime } from "../logic/ScoreCalculator.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create(data = {}) {
    const levelNum = data.level ?? 1;
    const totalKeys = data.totalKeys ?? 0;
    const totalCollectibles = data.totalCollectibles ?? 3;

    this.levelStartTime = 0;
    this.timerRunning = false;
    this.collectedCount = 0;
    this.totalCollectibles = totalCollectibles;

    const hudY = 24;
    const { width } = this.scale;

    this.add.text(16, 16, `Level ${levelNum}`, {
      fontFamily: "EarlyGameBoy",
      fontSize: "26px",
      color: colors.textDark,
    });

    this.timerText = this.add
      .text(width / 2, hudY, "0", {
        fontFamily: "EarlyGameBoy",
        fontSize: "26px",
        color: colors.textDark,
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.collectiblesText = this.add
      .text(width - 16, hudY, `yomari ${this.collectedCount}/${totalCollectibles}`, {
        fontFamily: "EarlyGameBoy",
        fontSize: "18px",
        color: colors.textDark,
        align: "right",
      })
      .setOrigin(1, 0);

    if (totalKeys > 0) {
      this.keyText = this.add.text(16, 52, `Keys: 0/${totalKeys}`, {
        fontFamily: "EarlyGameBoy",
        fontSize: "20px",
        color: colors.textDark,
      });

      this.events.on("keysChanged", (collectedKeys, nextTotalKeys) => {
        this.keyText.setText(`Keys: ${collectedKeys}/${nextTotalKeys}`);
      });
    }

    this.events.on("collectiblesChanged", (collected, total) => {
      this.collectedCount = collected;
      this.totalCollectibles = total;
      this.collectiblesText.setText(`yomari ${collected}/${total}`);
    });

    // Start timer automatically when UIScene is launched (from Intro Scene)
    this.startTimer();
  }

  update(time, delta) {
    if (!this.timerRunning) return;

    // Capture the start time on the very first frame to avoid `this.time.now` being 0 during create()
    if (this.levelStartTime === -1) {
      this.levelStartTime = time;
    }

    const elapsedMs = time - this.levelStartTime;
    this.timerText.setText(formatElapsedTime(elapsedMs));
  }

  startTimer() {
    if (this.timerRunning) return;

    // Set to -1 so update() knows to capture the exact time on its first frame
    this.levelStartTime = -1;
    this.timerRunning = true;
  }

  stopTimer() {
    if (!this.timerRunning) {
      return 0;
    }

    // If it somehow stopped before the first frame, elapsed is 0
    if (this.levelStartTime === -1) {
      this.timerRunning = false;
      return 0;
    }

    const elapsedMs = this.time.now - this.levelStartTime;
    this.timerRunning = false;
    this.timerText.setText(formatElapsedTime(elapsedMs));
    return elapsedMs;
  }
}

