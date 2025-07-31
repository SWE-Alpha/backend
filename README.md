# Buddies Inn Backend

This repository contains the backend server for the Buddies Inn Project, built with Node.js and Express.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)

## About

The Buddies Inn backend provides the core server-side logic, database integration, and RESTful APIs needed to power the Buddies Inn application.

## Features

- RESTful API built with Express.js
- User authentication and authorization (planned)
- Database integration (planned)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/SWE-Alpha/backend.git
    cd backend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file in the root of the backend directory with this template:

    ```env
    # Server Configuration
    PORT=
    NODE_ENV=
    
    # Database Configuration
    
    DATABASE_URL=
    
    # JWT Configuration (add when implementing auth)
    JWT_SECRET=
    
    
    ```

    - `PORT`: The port your server will run on (default: 5000).
    - `NODE_ENV`: Set to `development` or `production`.
    - `DATABASE_URL`: (Optional) Your database connection string.
    - `JWT_SECRET`: (Optional) Secret key for JWT authentication.
    
    > Never commit your `.env` file to version control.

4. Start the development server:
    ```bash
    npm run dev
    ```
