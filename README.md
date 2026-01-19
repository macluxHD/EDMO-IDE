# EDMO IDE

A visual programming environment for controlling EDMO modular robots. This project is part of Project 3-1 (BCS3300) at Maastricht University.

## Live Demo

Try it out at: [https://macluxhd.github.io/EDMO-IDE/](https://macluxhd.github.io/EDMO-IDE/)

## Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/en/download) (version 18 or higher recommended)
- npm (comes with Node.js)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/macluxHD/EDMO-IDE
   ```

2. **Navigate to the project directory**
   ```bash
   cd EDMO-IDE
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - The terminal will display a local URL (typically `http://localhost:5173`)
   - Open this URL in your web browser

### Additional Commands

- `npm run build` - Build the project for production
- `npm run lint` - Run the linter to check code quality
- `npm run preview` - Preview the production build locally

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to a static hosting service.

## Acknowledgements

This project uses STL files from the educational modular robot platform **EDMO**, developed by the DKE SwarmLab at Maastricht University. Please acknowledge their work if you build upon these materials.

For more information about EDMO, visit the [EDMO project page](https://www.maastrichtuniversity.nl/edmo).

Thank you to the DKE SwarmLab at Maastricht University for providing these free to use materials.
