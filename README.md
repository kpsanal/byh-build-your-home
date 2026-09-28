# Construction Expense Management App

A full-stack web application for tracking and managing construction project expenses.

## Features

- **User Authentication**: Secure login and registration
- **Project Management**: Create and manage multiple construction projects
- **Expense Tracking**: Log expenses with detailed information (vendor, category, amount, date)
- **Material Planning**: Track quantities, suppliers, unit costs, order status, and required dates
- **Construction Timeline**: Plan work items with start dates, due dates, and progress status
- **Categories**: Organize expenses by custom categories
- **Budget Tracking**: Monitor project budgets vs. actual spending
- **Reports & Analytics**: 
  - Expense summaries by category
  - Project budget analysis
  - Monthly trends
  - Financial reports
- **Payment Methods**: Track payment methods (cash, credit card, bank transfer, check)
- **Invoice Management**: Store invoice numbers and references

## Tech Stack

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- CSS3 for styling

### Backend
- Node.js with Express
- SQLite for local development; PostgreSQL on GKE
- JWT authentication
- Bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

#### Backend Setup
```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

#### Frontend Setup
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

The frontend will start on `http://localhost:3000`

## Project Structure

```
byh-build-your-home/
├── backend/
│   ├── db/                 # Database setup
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/                # React application
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── infra/
│   └── gke/
│       ├── k8s/app.yaml   # Kubernetes workloads and services
│       ├── main.tf        # GKE and Artifact Registry
│       ├── variables.tf
│       ├── outputs.tf
│       └── README.md      # GKE deployment instructions
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/project/:projectId` - Get expenses by project
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Materials
- `GET /api/materials` - List materials, optionally filtered by `project_id`
- `POST /api/materials` - Add a planned or purchased material
- `PUT /api/materials/:id` - Update a material
- `DELETE /api/materials/:id` - Remove a material

### Construction Timeline
- `GET /api/schedule` - List tasks, optionally filtered by `project_id`
- `POST /api/schedule` - Add a dated construction task
- `PUT /api/schedule/:id` - Update a task and its progress
- `DELETE /api/schedule/:id` - Remove a task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Reports
- `GET /api/reports/summary/category` - Expenses by category
- `GET /api/reports/summary/project` - Budget analysis by project
- `GET /api/reports/summary/date-range` - Expenses for date range
- `GET /api/reports/trend/monthly` - Monthly expense trends

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Projects**: Add construction projects with budget information
3. **Track Expenses**: Log expenses as they occur
4. **View Reports**: Analyze spending patterns and budget status
5. **Export Data**: Generate reports for analysis

## Database Schema

### Users
- id, email, password, name, created_at

### Projects
- id, user_id, name, description, location, start_date, end_date, budget, created_at

### Expenses
- id, user_id, project_id, category_id, amount, description, vendor, date, invoice_number, payment_method, created_at

### Categories
- id, user_id, name, color, created_at

### Invoices
- id, user_id, project_id, invoice_number, vendor, amount, date, due_date, status, notes, created_at

### Materials
- id, user_id, project_id, name, quantity, unit, unit_cost, vendor, status, needed_by, created_at

### Schedule Tasks
- id, user_id, project_id, title, description, start_date, due_date, status, created_at

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- API endpoints protected with middleware
- Project data is scoped to the authenticated user; production PostgreSQL also enforces tenant-safe project/category references
- Environment variables for sensitive data

## Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=your_jwt_secret_key
DATABASE_PATH=./data/expenses.db
# Production uses DATABASE_URL for PostgreSQL instead of DATABASE_PATH
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

To modify the application:

1. Backend changes: Edit files in `/backend` and restart the server
2. Frontend changes: Edit files in `/frontend`, changes are reflected with hot reload

## Future Enhancements

- Export to PDF/Excel
- Email notifications
- Multiple user roles
- Team collaboration
- Mobile app
- Cloud backup
- Advanced analytics
- Payment integration

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
