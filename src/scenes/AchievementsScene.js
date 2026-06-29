import Phaser from "phaser";
import colors from "../styles/colors.js";
import AchievementManager from "../logic/AchievementManager.js";
import { ACHIEVEMENT_XP } from "../logic/Achievements.js";
import { createAchievementBadge } from "../ui/AchievementPopup.js";

const LIST_DEPTH = 10;

export default class AchievementsScene extends Phaser.Scene {
  constructor() {
    super("AchievementsScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(colors.bgNum);

    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    const panelWidth = Math.min(width * 0.82, 720);
    const panelHeight = Math.min(height * 0.78, 560);
    const panelLeft = centerX - panelWidth / 2;
    const panelTop = centerY - panelHeight / 2;
    const panelBottom = panelTop + panelHeight;

    // Panel shadows & body
    this.add.rectangle(
      centerX + 8,
      centerY + 8,
      panelWidth,
      panelHeight,
      colors.deepNum,
    );
    this.add.rectangle(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      colors.darkNum,
    );

    const frame = this.add.graphics();
    frame.lineStyle(6, colors.accentNum, 1);
    frame.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 14);
    frame.lineStyle(2, colors.controlsNum, 1);
    frame.strokeRoundedRect(
      panelLeft + 10,
      panelTop + 10,
      panelWidth - 20,
      panelHeight - 20,
      10,
    );

    this.add
      .text(centerX, panelTop + 36, "ACHIEVEMENTS", {
        fontFamily: "EarlyGameBoy",
        fontSize: "28px",
        color: colors.accent,
        stroke: colors.dark,
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const unlockedCount = AchievementManager.getUnlockedCount();
    this.add
      .text(
        centerX,
        panelTop + 68,
        `${unlockedCount}/6 unlocked  (+${ACHIEVEMENT_XP} EXP each)`,
        {
          fontFamily: "EarlyGameBoy",
          fontSize: "13px",
          color: colors.controls,
        },
      )
      .setOrigin(0.5);

    // ── Layout constants ──────────────────────────────────────────────────────
    this.rowHeight = 74;
    this.rowWidth = panelWidth - 56;
    this.listLeft = centerX - this.rowWidth / 2;

    // Reserve space: header (96px) + BACK button area (72px) + padding
    const BUTTON_AREA = 72;
    const listAreaTop = panelTop + 96;
    const listAreaBottom = panelBottom - BUTTON_AREA;
    this.listAreaHeight = listAreaBottom - listAreaTop;
    this.listTop = listAreaTop;

    // ── Scrollable container ──────────────────────────────────────────────────
    this.scrollY = 0;
    this.listContainer = this.add.container(0, 0).setDepth(LIST_DEPTH);

    // Mask — must be added to the scene (not { add: false }) for geometry
    // masks to correctly clip containers in Phaser 3.
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(
      this.listLeft - 30,
      listAreaTop,
      this.rowWidth + 60,
      this.listAreaHeight,
    );
    maskShape.setVisible(false);
    const listMask = maskShape.createGeometryMask();
    this.listContainer.setMask(listMask);

    // Arrow cursor — share the same mask so it clips at the header boundary too
    this.selectionArrow = this.add
      .text(this.listLeft - 22, 0, ">", {
        fontFamily: "EarlyGameBoy",
        fontSize: "22px",
        color: colors.light,
      })
      .setOrigin(0.5)
      .setDepth(LIST_DEPTH + 1)
      .setMask(listMask);

    // ── Data ─────────────────────────────────────────────────────────────────
    this.achievements = AchievementManager.getAllWithStatus();
    this.selectedIndex = this.achievements.findIndex((a) => !a.unlocked);
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    this.rowContainers = [];
    this._buildList();
    this._updateSelection();
    this._ensureVisible(this.selectedIndex);

    // ── Scroll indicators (▲ / ▼) ────────────────────────────────────────────
    this.scrollUpIndicator = this.add
      .text(centerX, listAreaTop - 2, "▲", {
        fontFamily: "EarlyGameBoy",
        fontSize: "14px",
        color: colors.controls,
      })
      .setOrigin(0.5, 1)
      .setDepth(LIST_DEPTH + 2)
      .setVisible(false);

    this.scrollDownIndicator = this.add
      .text(centerX, listAreaBottom + 2, "▼", {
        fontFamily: "EarlyGameBoy",
        fontSize: "14px",
        color: colors.controls,
      })
      .setOrigin(0.5, 0)
      .setDepth(LIST_DEPTH + 2)
      .setVisible(false);

    this._updateScrollIndicators();

    // ── BACK button – anchored just below the panel ───────────────────────────
    const btnY = panelBottom + 34;
    this._createButton({
      x: centerX,
      y: btnY,
      width: 180,
      height: 48,
      label: "BACK",
      onClick: () => this.scene.start("MenuScene"),
    });

    // ── Input ────────────────────────────────────────────────────────────────
    this.input.keyboard?.on("keydown-UP", () => this._moveSelection(-1));
    this.input.keyboard?.on("keydown-DOWN", () => this._moveSelection(1));
    this.input.keyboard?.once("keydown-ESC", () =>
      this.scene.start("MenuScene"),
    );

    // Mouse-wheel scrolling
    this.input.on("wheel", (_ptr, _dx, _dy, deltaY) => {
      this._scrollBy(deltaY > 0 ? 1 : -1);
    });
  }

  // ── List building ──────────────────────────────────────────────────────────

  _buildList() {
    this.rowContainers.forEach((row) => row.destroy());
    this.rowContainers = [];

    this.achievements.forEach((achievement, index) => {
      const y = this.listTop + index * this.rowHeight + this.rowHeight / 2;
      const row = this._createRow(achievement, index, y);
      this.rowContainers.push(row);
    });
  }

  _createRow(achievement, index, y) {
    const row = this.add.container(this.listLeft + this.rowWidth / 2, y);
    this.listContainer.add(row);

    const bg = this.add.rectangle(
      0,
      0,
      this.rowWidth,
      this.rowHeight - 8,
      colors.panelNum,
      0.55,
    );
    const border = this.add.graphics();
    row.add([bg, border]);

    row.bg = bg;
    row.border = border;
    row.index = index;
    row.baseY = y; // store original Y for scroll offsetting

    const iconX = -this.rowWidth / 2 + 38;
    const badge = createAchievementBadge(
      this,
      iconX,
      0,
      48,
      achievement.badge,
      {
        unlocked: achievement.unlocked,
      },
    );
    row.add(badge);

    const textX = iconX + 44;
    const titleColor = achievement.unlocked ? colors.light : colors.controls;
    const title = this.add
      .text(textX, -12, achievement.title, {
        fontFamily: "EarlyGameBoy",
        fontSize: "15px",
        color: titleColor,
      })
      .setOrigin(0, 0.5);

    const description = this.add
      .text(textX, 12, achievement.description, {
        fontFamily: "EarlyGameBoy",
        fontSize: "12px",
        color: achievement.unlocked ? colors.accent : colors.textDark,
        wordWrap: { width: this.rowWidth - 120 },
      })
      .setOrigin(0, 0.5);

    row.add([title, description]);
    row.title = title;
    row.description = description;

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      this.selectedIndex = index;
      this._updateSelection();
    });
    bg.on("pointerover", () => {
      this.selectedIndex = index;
      this._updateSelection();
    });

    return row;
  }

  // ── Scroll helpers ─────────────────────────────────────────────────────────

  _maxScrollIndex() {
    const visibleRows = Math.floor(this.listAreaHeight / this.rowHeight);
    return Math.max(0, this.achievements.length - visibleRows);
  }

  _scrollBy(delta) {
    this.scrollY = Phaser.Math.Clamp(
      this.scrollY + delta,
      0,
      this._maxScrollIndex(),
    );
    this._applyScroll();
    this._updateScrollIndicators();
  }

  _applyScroll() {
    const offset = this.scrollY * this.rowHeight;
    this.rowContainers.forEach((row) => {
      row.setY(row.baseY - offset);
    });
    // Keep the selection arrow aligned
    const selectedRow = this.rowContainers[this.selectedIndex];
    if (selectedRow) {
      this.selectionArrow.setY(selectedRow.y);
    }
  }

  _ensureVisible(index) {
    const visibleRows = Math.floor(this.listAreaHeight / this.rowHeight);
    if (index < this.scrollY) {
      this.scrollY = index;
    } else if (index >= this.scrollY + visibleRows) {
      this.scrollY = index - visibleRows + 1;
    }
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this._maxScrollIndex());
    this._applyScroll();
    this._updateScrollIndicators();
  }

  _updateScrollIndicators() {
    this.scrollUpIndicator?.setVisible(this.scrollY > 0);
    this.scrollDownIndicator?.setVisible(this.scrollY < this._maxScrollIndex());
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  _updateSelection() {
    this.rowContainers.forEach((row, index) => {
      const selected = index === this.selectedIndex;
      const achievement = this.achievements[index];

      row.border.clear();
      if (selected) {
        row.border.lineStyle(4, colors.accentNum, 1);
        row.border.strokeRoundedRect(
          -this.rowWidth / 2,
          -(this.rowHeight - 8) / 2,
          this.rowWidth,
          this.rowHeight - 8,
          6,
        );
        row.bg.setFillStyle(colors.panelNum, 0.85);
        row.title.setColor(colors.light);
        row.description.setColor(
          achievement.unlocked ? colors.accent : colors.light,
        );
      } else {
        row.bg.setFillStyle(colors.panelNum, 0.45);
        row.title.setColor(
          achievement.unlocked ? colors.light : colors.controls,
        );
        row.description.setColor(
          achievement.unlocked ? colors.accent : colors.textDark,
        );
      }
    });

    const selectedRow = this.rowContainers[this.selectedIndex];
    if (selectedRow) {
      this.selectionArrow.setY(selectedRow.y);
      this.selectionArrow.setVisible(true);
    }
  }

  _moveSelection(delta) {
    this.selectedIndex = Phaser.Math.Clamp(
      this.selectedIndex + delta,
      0,
      this.achievements.length - 1,
    );
    this._updateSelection();
    this._ensureVisible(this.selectedIndex);
  }

  // ── Button ─────────────────────────────────────────────────────────────────

  _createButton({ x, y, width, height, label, onClick }) {
    const shadow = this.add.rectangle(
      x + 4,
      y + 4,
      width,
      height,
      colors.deepNum,
    );
    const body = this.add.rectangle(x, y, width, height, colors.accentNum);
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: "EarlyGameBoy",
        fontSize: "16px",
        color: colors.dark,
      })
      .setOrigin(0.5);

    body.setInteractive({ useHandCursor: true });
    body.on("pointerdown", onClick);
    body.on("pointerover", () => {
      body.setFillStyle(colors.darkNum);
      labelText.setColor(colors.accent);
    });
    body.on("pointerout", () => {
      body.setFillStyle(colors.accentNum);
      labelText.setColor(colors.dark);
    });

    shadow.setDepth(1);
    body.setDepth(2);
    labelText.setDepth(3);
  }
}
