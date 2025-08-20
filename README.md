# Ubika - Real Estate App

This is a Next.js application built with TypeScript and React for a real estate project. The application features a user-friendly interface to help users find their new homes, now powered by **Neon Database** for serverless PostgreSQL.

## Features

- **Modern Property Search**: Advanced filtering by price, location, property type, and features
- **Interactive Map**: Google Maps integration for property visualization
- **Property Gallery**: Beautiful image galleries for each property
- **Neighborhood Information**: Detailed neighborhood data with walkability scores
- **Responsive Design**: Mobile-first design with modern UI components
- **Serverless Database**: Powered by Neon Database for optimal performance

## Database

This application uses **Neon Database**, a serverless PostgreSQL platform that provides:
- Automatic scaling to zero when not in use
- Built-in connection pooling
- Point-in-time recovery
- Database branching for development
- Seamless Vercel integration

### Database Setup

```bash
# Test database connection
npm run db:test

# Complete database setup (recommended)
npm run db:setup

# Reset database (truncate tables)
npm run db:reset

# List properties for verification
npm run db:list
```

## Project Structure

```
real-estate-app
├── public
├── src
│   ├── components
│   │   ├── Banner.tsx
│   │   ├── SearchBar.tsx
│   │   └── index.ts
│   ├── pages
│   │   ├── _app.tsx
│   │   ├── index.tsx
│   │   └── api
│   │       └── hello.ts
│   ├── styles
│   │   ├── Banner.module.css
│   │   ├── SearchBar.module.css
│   │   └── globals.css
│   └── types
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd real-estate-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open your browser and go to `http://localhost:3000` to see the application in action.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
