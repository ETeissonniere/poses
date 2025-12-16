# Pose Transform Tool

A web utility for transforming 3D poses using quaternion math. Input a pose as XYZ + quaternion, apply transformations, and chain operations.

## Quick Start

```bash
docker compose up
```

Open http://localhost:5173

## Features

- Input position (X, Y, Z) and quaternion (W, X, Y, Z)
- View 4x4 transformation matrices
- Apply transforms in local frame (result = pose × transform)
- Chain transforms with "Use as New Input"
- Copy values to clipboard
- Quaternion normalization warnings

## Stack

- React + TypeScript
- Three.js (math)
- Tailwind CSS
- Vite
- Docker
