import Phaser from "phaser";
import colors from "../styles/colors.js";
import ProgressManager from "../logic/ProgressManager.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    let introSound = this.sound.get("intro-sound");
    if (!introSound) {
      introSound = this.sound.add("intro-sound", { loop: true, volume: 2.0 });
    }
    if (!introSound.isPlaying) {
      introSound.play();
    }

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const textConfig = {
      fontFamily: "EarlyGameBoy",
      fontSize: "45px",
      align: "center",
      stroke: colors.dark,
      strokeThickness: 12,
      letterSpacing: 0,
    };

    // ── EXP BAR (top-left, pixel-art style) ──────────────────────────
    this._drawExpBar();

    this.add
      .image(cx, cy - 180, "menu-rath")
      .setOrigin(0.5)
      .setScale(0.6);

    // Shadow layer — offset behind, dark color
    this.add
      .text(cx + 4, cy - 100 + 80, "GALLI\nEXPLORER", {
        ...textConfig,
        color: colors.dark,
      })
      .setOrigin(0.5);

    // Main text on top
    this.add
      .text(cx, cy - 28, "GALLI\nEXPLORER", {
        ...textConfig,
        color: colors.accent,
      })
      .setOrigin(0.5);

    // OBJECTIVE
    this.add
      .text(
        cx,
        cy + 85,
        "NAVIGATE THROUGH BHAKTAPUR'S CHAOTIC NARROW GALLIS\nAND HELP BAUCHA REACH HOME SAFELY.",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "17px",
          color: colors.textDark,
          align: "center",
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    // CONTROLS
    this.add
      .text(
        cx,
        cy + 155,
        "USE ARROW KEYS OR A / D TO MOVE.\n ON PHONES: USE THE CORNER BUTTONS",
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "15px",
          color: colors.controls,
          align: "center",
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    // ── PLAY BUTTON ─────────────
    const nextLevel = ProgressManager.getNextLevel();

    const playBg = this.add.rectangle(cx, cy + 226, 210, 58, colors.accentNum);
    const playText = this.add
      .text(cx, cy + 226, "PLAY", {
        fontFamily: "EarlyGameBoy",
        fontSize: "18px",
        color: colors.dark,
        align: "center",
      })
      .setOrigin(0.5);

    playBg.setInteractive({ useHandCursor: true });
    playBg.on("pointerdown", () => {
      this.scene.start("CharacterSelectionScene");
    });
    playBg.on("pointerover", () => {
      playBg.setFillStyle(colors.darkNum);
      playText.setColor(colors.accent);
    });
    playBg.on("pointerout", () => {
      playBg.setFillStyle(colors.accentNum);
      playText.setColor(colors.dark);
    });

    playBg.setDepth(2);
    playText.setDepth(3);

    // ── ACHIEVEMENTS BUTTON ───────────────────────────────────────
    const achievementsBg = this.add.rectangle(cx, cy + 300, 210, 58, colors.panelNum);
    const achievementsText = this.add
      .text(cx, cy + 300, "ACHIEVEMENTS", {
        fontFamily: "EarlyGameBoy",
        fontSize: "16px",
        color: colors.light,
        align: "center",
      })
      .setOrigin(0.5);

    achievementsBg.setInteractive({ useHandCursor: true });
    achievementsBg.on("pointerdown", () => {
      this.scene.start("AchievementsScene");
    });
    achievementsBg.on("pointerover", () => {
      achievementsBg.setFillStyle(colors.darkNum);
      achievementsText.setColor(colors.accent);
    });
    achievementsBg.on("pointerout", () => {
      achievementsBg.setFillStyle(colors.panelNum);
      achievementsText.setColor(colors.light);
    });

    achievementsBg.setDepth(2);
    achievementsText.setDepth(3);

    this.input.keyboard?.once("keydown-ENTER", () => {
      this.scene.start("CharacterSelectionScene");
    });
  }

  /**
   * Draw a pixel-art EXP bar in the top-left corner.
   * Matches the retro green-gradient style from the reference image.
   */
  _drawExpBar() {
    const currentXP = ProgressManager.getXP();
    const maxXP = ProgressManager.getMaxXP();
    const fillRatio = Math.min(currentXP / maxXP, 1);

    // Bar dimensions & position
    const barX = 16;
    const barY = 14;
    const barWidth = 220;
    const barHeight = 30;
    const borderSize = 4;
    const pixelSize = 4; // pixel-art block size

    const g = this.add.graphics();
    g.setDepth(100);

    // ── Outer border (dark outline) ──
    g.fillStyle(0x1a0d05, 1);
    g.fillRect(
      barX - borderSize,
      barY - borderSize,
      barWidth + borderSize * 2,
      barHeight + borderSize * 2,
    );

    // ── Inner border (medium brown) ──
    g.fillStyle(0x3b2210, 1);
    g.fillRect(
      barX - borderSize / 2,
      barY - borderSize / 2,
      barWidth + borderSize,
      barHeight + borderSize,
    );

    // ── Background (empty bar) ──
    g.fillStyle(0x2b1708, 1);
    g.fillRect(barX, barY, barWidth, barHeight);

    // ── Filled portion (pixel-art green gradient) ──
    const fillWidth =
      Math.floor((barWidth * fillRatio) / pixelSize) * pixelSize;

    if (fillWidth > 0) {
      // Draw pixelated fill blocks with gradient from darker green to lighter
      for (let x = 0; x < fillWidth; x += pixelSize) {
        for (let y = 0; y < barHeight; y += pixelSize) {
          const xProgress = x / fillWidth;
          const yProgress = y / barHeight;

          // Brown gradient based on #7a4f2a: lighter at top, darker at bottom
          let redBase, greenBase, blueBase;

          if (yProgress < 0.3) {
            // Top rows — lighter brown highlight
            redBase = 0x9a + Math.floor(xProgress * 0x15);
            greenBase = 0x6a + Math.floor(xProgress * 0x10);
            blueBase = 0x3e + Math.floor(xProgress * 0x0a);
          } else if (yProgress < 0.7) {
            // Middle rows — core #7a4f2a tone
            redBase = 0x7a + Math.floor(xProgress * 0x10);
            greenBase = 0x4f + Math.floor(xProgress * 0x0c);
            blueBase = 0x2a + Math.floor(xProgress * 0x08);
          } else {
            // Bottom rows — darker brown
            redBase = 0x58 + Math.floor(xProgress * 0x0c);
            greenBase = 0x38 + Math.floor(xProgress * 0x08);
            blueBase = 0x1a + Math.floor(xProgress * 0x06);
          }

          // Clamp values
          greenBase = Math.min(greenBase, 0xff);
          redBase = Math.min(redBase, 0xff);
          blueBase = Math.min(blueBase, 0xff);

          const color = (redBase << 16) | (greenBase << 8) | blueBase;
          g.fillStyle(color, 1);
          g.fillRect(barX + x, barY + y, pixelSize, pixelSize);
        }
      }

      // ── Diagonal pixel-art edge on the fill end (jagged pixel edge) ──
      if (fillRatio < 1) {
        const edgeX = barX + fillWidth;
        // Create a stair-step pattern on the right edge of the fill
        for (let y = 0; y < barHeight; y += pixelSize) {
          const step = Math.floor(y / (pixelSize * 2));
          const offset = step % 2 === 0 ? 0 : pixelSize;

          if (offset === 0 && edgeX + pixelSize <= barX + barWidth) {
            // Add extra pixel block for jagged edge
            const yProgress = y / barHeight;
            let red = yProgress < 0.4 ? 0x9a : 0x7a;
            let green = yProgress < 0.4 ? 0x6a : 0x4f;
            let blue = yProgress < 0.4 ? 0x3e : 0x2a;

            const color = (red << 16) | (green << 8) | blue;
            g.fillStyle(color, 0.7);
            g.fillRect(edgeX, barY + y, pixelSize, pixelSize);
          }
        }
      }
    }

    // ── "EXP" label (inside the bar, left-aligned) ──
    this.add
      .text(barX + 8, barY + barHeight / 2, "EXP", {
        fontFamily: "EarlyGameBoy",
        fontSize: "14px",
        color: "#f7efe3",
        stroke: "#1a0d05",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setDepth(101);

    // ── XP counter text (right side of bar) ──
    this.add
      .text(
        barX + barWidth - 8,
        barY + barHeight / 2,
        `${currentXP}/${maxXP}`,
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "11px",
          color: "#f7efe3",
          stroke: "#1a0d05",
          strokeThickness: 3,
        },
      )
      .setOrigin(1, 0.5)
      .setDepth(101);

    // ── "LEVEL UP" text below bar (only if bar is full) ──
    if (fillRatio >= 1) {
      const levelUpText = this.add
        .text(barX + barWidth / 2, barY + barHeight + 12, "LEVEL UP", {
          fontFamily: "EarlyGameBoy",
          fontSize: "13px",
          color: "#b98a5a",
          stroke: "#1a0d05",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(101);

      // Pulsing animation for "LEVEL UP"
      this.tweens.add({
        targets: levelUpText,
        alpha: { from: 1, to: 0.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}
