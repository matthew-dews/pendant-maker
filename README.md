# Pendant Designer

A simple, web-based tool for designing 3D-printable necklace pendants. This application allows you to create a 2D profile and see it instantly rendered as a 3D model, ready for export.

## Features

- **Interactive 2D Profile Editor:** Click to add points, drag to move them, and double-click to delete.
- **Real-time 3D Preview:** See your design come to life as you edit the 2D profile.
- **Precision Editing:** Select any point to manually input its exact X and Y coordinates (1 unit = 1mm).
- **Advanced Visualization:** Toggle wireframe and normal material views to better understand the model's geometry.
- **Project Persistence:** Your design is automatically saved in your browser using `localStorage`, so you can pick up where you left off.
- **Import/Export:** 
    - Export your design's profile to a `.json` file for backup or sharing.
    - Export the 3D model to an `.stl` file, the standard format for 3D printing.
    - Import a `.json` file to load a previous design.
- **Helpful UI:** Includes a first-time user guide and a robust set of controls for a smooth workflow.

## How to Run

This project consists of static HTML, CSS, and JavaScript files and does not require a build step. To run it, you need a simple local web server.

If you have Python installed, you can use its built-in `http.server` module:

1. Navigate to the project directory in your terminal.
2. Run the command:
   ```bash
   python -m http.server
   ```
3. Open your web browser and go to `http://localhost:8000`.

## Technology Stack

- **HTML5**
- **CSS3**
- **JavaScript** (ES Modules)
- **Three.js** for 3D rendering and STL export.
