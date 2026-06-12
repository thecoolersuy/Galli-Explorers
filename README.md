# 🎮 Galli Explorer

> **NAVIGATE THROUGH BHAKTAPUR'S CHAOTIC NARROW GALLIS**  
> **AND HELP BAUCHA REACH HOME SAFELY.**

**Galli Explorer** is a retro-style pixel art arcade/adventure web game inspired by the classic Game Boy aesthetic. Players take on the role of Baucha, navigating through the narrow, chaotic, and beautiful alleyways (gallis) of Bhaktapur. 

---

## Controls

* **On Desktop (Keyboard):** Use the **Arrow Keys** or **A / D** keys to move.
* **On Phones / Mobile:** Use the dedicated **Corner Buttons** rendered on the screen.

---

## Getting Started

Follow these simple instructions to clone and run the game locally on your laptop.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (Node.js 18+ is recommended).

### 1. Clone the Repository

Clone this repository to your local machine using Git:

```bash
git clone https://github.com/thecoolersuy/Galli-Explorers.git
cd Galli-Explorers
```

*(Note: Replace the URL if your repository is hosted elsewhere or use the SSH link if configured).*

### 2. Install Dependencies

Install the project dependencies (including Phaser and Vite):

```bash
npm install
```

### 3. Run the Development Server

Start the local development server:

```bash
npm run dev
```

Once started, the terminal will display a local address (usually `http://localhost:5173`). Open that URL in your web browser to play the game!

## Collaboration Guide (For Team Members)

To collaborate smoothly, follow this workflow when working on features or bug fixes:

### 1. Sync Your Main Branch
Before starting any new work, make sure your local `main` branch is up to date:
```bash
git checkout main
git pull origin main
```

### 2. Create a Feature Branch
Do not work directly on the `main` branch. Create a new branch named after you
```bash
# Example: git checkout -b melisa
git checkout -b melisa
```

### 3. Make and Commit Changes
As you develop, commit your changes with clear, descriptive commit messages:
```bash
git add .
git commit -m "Add short descriptive message of what was changed"
```

### 4. Push and Create a Pull Request
Push your branch to GitHub:
```bash
git push origin melisa
```
Then, go to the GitHub repository page and open a **Pull Request (PR)** to merge your branch into `main` so the team can review and merge it.

---

## Tech Stack

* **Game Engine:** [Phaser JS](https://phaser.io/) (v4.1.0)
* **Build System & Dev Server:** [Vite](https://vite.dev/) (v8)
* **Styling:** Custom CSS with retro EarlyGameBoy font rendering

