# Task Management API

A robust RESTful API for managing tasks, built with Node.js, Express, MongoDB, and Redis for caching.

## Features
- User authentication with JWT
- CRUD operations for tasks
- Task filtering, sorting, and pagination
- Redis caching for improved performance (Used in memory caching as a fallback)
- Comprehensive test suite
- Priority Queue Scheduling


## Setup and Installation

### Clone the Repository
```bash
git clone https://github.com/1ncreo/task-management-api.git
cd task-management-api
```

### Install Dependencies
```bash
npm install
```

### Environment Configuration
Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```
You can generate a strong JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Run the Server
For development with auto-reload:
```bash
npm run dev
```

For testing:
```bash
NODE_ENV=test npm test
```


### Authentication

#### Register a New User
- **Method**: POST
- **URL**: `http://localhost:3000/api/auth/register`
- **Body (raw JSON)**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**: Status 201 with user details and token

#### Login
- **Method**: POST
- **URL**: `http://localhost:3000/api/auth/login`
- **Body (raw JSON)**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**: Status 200 with token

### Working with Tasks

For all task endpoints, include the JWT token in the `Authorization` header:
- **Header Key**: `Authorization`
- **Header Value**: `Bearer your_jwt_token`

#### Create a Task
- **Method**: POST
- **URL**: `http://localhost:3000/api/tasks`
- **Headers**: Include `Authorization` header with token
- **Body (raw JSON)**:
  ```json
  {
    "title": "Complete project",
    "description": "Finish the task management API",
    "dueDate": "2025-03-20",
    "status": "pending",
    "priority": "high"
  }
  ```
- **Expected Response**: Status 201 with created task details

#### Get All Tasks
- **Method**: GET
- **URL**: `http://localhost:3000/api/tasks`
- **Headers**: Include `Authorization` header with token
- **Expected Response**: Status 200 with an array of tasks

#### Get Task by ID
- **Method**: GET
- **URL**: `http://localhost:3000/api/tasks/:taskId`
- **Headers**: Include `Authorization` header with token
- **Expected Response**: Status 200 with task details

#### Update Task
- **Method**: PUT
- **URL**: `http://localhost:3000/api/tasks/:taskId`
- **Headers**: Include `Authorization` header with token
- **Body (raw JSON)**: Include fields to update, for example:
  ```json
  {
    "status": "completed"
  }
  ```
- **Expected Response**: Status 200 with updated task

#### Delete Task
- **Method**: DELETE
- **URL**: `http://localhost:3000/api/tasks/:taskId`
- **Headers**: Include `Authorization` header with token
- **Expected Response**: Status 200 with success message

### Advanced Task Queries

#### Filtering Tasks
- **Method**: GET
- **URL**: `http://localhost:3000/api/tasks?status=pending&priority=high`
- **Headers**: Include `Authorization` header with token
- **Expected Response**: Status 200 with filtered tasks

#### Sorting Tasks
- **Method**: GET
- **URL**: `http://localhost:3000/api/tasks?sortBy=dueDate&sortOrder=asc`
- **Headers**: Include `Authorization` header with token
- **Expected Response**: Status 200 with sorted tasks

#### Pagination
- **Method**: GET
- **URL**: `http://localhost:3000/api/tasks?page=1&limit=10`
- **Headers**: Include `Authorization` header with token
- **Expected Response**: Status 200 with paginated tasks

## Running Tests
- Use the following command to run the test suite:
```bash
npm test
```

## API Endpoints Summary

### Authentication
- **POST** `/api/auth/register` - Register a new user
- **POST** `/api/auth/login` - Login and get token

### Tasks
- **GET** `/api/tasks` - Get all tasks (with filtering, sorting, pagination)
- **GET** `/api/tasks/:id` - Get a specific task
- **POST** `/api/tasks` - Create a new task
- **PUT** `/api/tasks/:id` - Update a task
- **DELETE** `/api/tasks/:id` - Delete a task
