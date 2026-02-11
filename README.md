# Cubiomes Explorer 🌍

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![C](https://img.shields.io/badge/C-00599C?style=for-the-badge&logo=c&logoColor=white)](https://en.wikipedia.org/wiki/C_(programming_language))

A high-precision Minecraft map engine and seed explorer built with **Next.js**, **React**, and the **Cubiomes** C library. Discover biomes and structures across all three dimensions (Overworld, Nether, and End) with blazing-fast rendering and an interactive UI.

---

## ✨ Features

- **🌐 Multi-Dimensional Support**: Explore the Overworld, Nether, and End with a single click.
- **🗺️ Interactive Map**: Smooth pan and zoom powered by a tiled Canvas 2D engine.
- **💎 Structure Finders**: Real-time structure detection (Villages, Strongholds, Bastions, End Cities, etc.).
- **⚡ High Performance**: Core biome generation logic written in C and interfaced via a lightweight CLI.
- **🎨 Premium UI**: Modern, dark-themed interface with glassmorphism and subtle animations.
- **🕹️ Version Awareness**: Supports Minecraft versions 1.18, 1.19, 1.20, and 1.21.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: (v18 or higher)
- **C Compiler**: (`gcc` or `clang` for building Cubiomes CLI)
- **Make**: For building the CLI tools.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dan-delion-source/Minecraft-Seed-Map.git
   cd Minecraft-Seed-Map
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Build the Cubiomes CLI**:
   ```bash
   cd cubiomes_cli
   make
   cd ..
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend API**: Next.js Route Handlers
- **Engine**: [Cubiomes](https://github.com/Cubiere/cubiomes) (C library for biome and structure generation)
- **Rendering**: HTML5 Canvas 2D with Tiled Interpolation

---

## 🎮 How to Use

1. **Enter a Seed**: Type any 64-bit integer or click the 🎲 icon to randomize.
2. **Select Version**: Choose your Minecraft version to ensure generation accuracy.
3. **Switch Dimensions**: Navigate between Overworld, Nether, and End.
4. **Toggle Structures**: Use the icon bar to filter which structures appear on the map.
5. **Explore**: Drag to pan, scroll to zoom. Hover over any point to see exact coordinates and biomes.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve functionality, UI, or performance.

---

## 📜 License

This project is open-source and available under the MIT License.

---

*Built with ❤️ for the Minecraft Community.*
