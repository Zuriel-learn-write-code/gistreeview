# GISTREEVIEW Backend

This is the backend server for GISTREEVIEW, providing API endpoints and database management for the tree and road monitoring system in Ambon city.

![GISTREEVIEW Backend Architecture](./public/image_backend.png)

## Features

- 🔐 Authentication & Authorization
  - JWT-based authentication
  - Role-based access control (Admin/Officer/User)
  - Secure password hashing
- 🗺️ Geospatial Features
  - PostGIS integration for spatial queries
  - Road geometry handling
  - GPS coordinate processing
- 📁 File Management
  - Image upload handling
  - Cloudinary integration for media storage
  - File type validation
- 🛣️ Road Management
  - CRUD operations for roads
  - Color and status management
  - Tree association tracking
- 🌳 Tree Management
  - Complete tree lifecycle handling
  - Status tracking
  - Picture management
- 📊 Report System
  - User report handling
  - Status workflow (pending/approved/rejected/resolved)
  - Picture attachments

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL with PostGIS
- Supabase for database hosting
- Cloudinary for media storage
- JSON Web Tokens (JWT)

## Database Schema

```prisma
// Key models include:
model User {
  id        String   @id @default(uuid())
  role      Role     @default(user)
  // ... other fields
}

model Tree {
  id        String     @id @default(uuid())
  latitude  Float
  longitude Float
  status    TreeStatus @default(good)
  // ... other fields
}

model Road {
  id        String    @id @default(uuid())
  geometry  Json?
  color     RoadColor?
  status    RoadStatus @default(unknown)
  // ... other fields
}

model Report {
  id        String       @id @default(uuid())
  status    ReportStatus @default(pending)
  // ... other fields
}
```

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_ORIGINS=http://localhost:5173
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Authentication
- POST `/api/login` - User login
- POST `/api/register` - User registration

### Trees
- GET `/api/trees` - List all trees
- POST `/api/trees` - Create new tree
- GET `/api/trees/:id` - Get tree details
- PUT `/api/trees/:id` - Update tree
- DELETE `/api/trees/:id` - Delete tree

### Roads
- GET `/api/roads` - List all roads
- GET `/api/roads/geojson` - Get roads in GeoJSON format
- POST `/api/roads` - Create new road
- PUT `/api/roads/:id` - Update road
- DELETE `/api/roads/:id` - Delete road

### Reports
- GET `/api/reports` - List reports
- POST `/api/reports` - Create report
- PUT `/api/reports/:id` - Update report status

## Deployment

The backend is configured for deployment on Vercel with the following specifications:
- Node.js runtime
- Serverless functions
- PostgreSQL database on Supabase
- Cloudinary for media storage

## Project Structure

```
backend/
├── prisma/           # Database schema and migrations
├── public/           # Static files
├── src/
│   ├── routes/       # API route handlers
│   ├── middleware/   # Express middleware
│   └── utils/        # Utility functions
├── api/              # Vercel serverless functions
└── package.json
```

## Security Features

- CORS configuration
- Input validation
- File upload restrictions
- Role-based access control
- Secure password handling
- Rate limiting

## Error Handling

The API implements standardized error responses:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is proprietary and confidential.

## Credits

Special thanks to:
- Supabase for database hosting
- Cloudinary for media storage
- PostGIS for spatial database capabilities