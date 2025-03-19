const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const User = require('../models/User');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

describe('Tasks API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = new User({
      username: 'taskuser',
      email: 'taskuser@example.com',
      password: 'password123'
    });
    
    await user.save();
    userId = user._id;

    token = jwt.sign(
      { id: userId, username: user.username },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    await Task.deleteMany({});
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
          status: 'pending'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('task');
      expect(res.body.task.title).toEqual('Test Task');
      expect(res.body.task.priority).toEqual('high');
    });

    it('should return 400 for invalid task data', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Test Description',
          priority: 'invalid',
          status: 'pending'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks for the user', async () => {
      const task1 = new Task({
        title: 'Task 1',
        description: 'Description 1',
        priority: 'high',
        status: 'pending',
        userId
      });
      
      const task2 = new Task({
        title: 'Task 2',
        description: 'Description 2',
        priority: 'medium',
        status: 'completed',
        userId
      });

      await task1.save();
      await task2.save();
      
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('tasks');
      expect(res.body.tasks.length).toEqual(2);
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter tasks by status', async () => {
      const task1 = new Task({
        title: 'Task 1',
        description: 'Description 1',
        priority: 'high',
        status: 'pending',
        userId
      });
      
      const task2 = new Task({
        title: 'Task 2',
        description: 'Description 2',
        priority: 'medium',
        status: 'completed',
        userId
      });
      
      await task1.save();
      await task2.save();
      
      const res = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('tasks');
      expect(res.body.tasks.length).toEqual(1);
      expect(res.body.tasks[0].status).toEqual('completed');
    });
  });

  describe('GET /api/tasks/scheduled', () => {
    it('should return tasks sorted by priority', async () => {
      const task1 = new Task({
        title: 'Low Priority Task',
        priority: 'low',
        status: 'pending',
        userId
      });
      
      const task2 = new Task({
        title: 'High Priority Task',
        priority: 'high',
        status: 'pending',
        userId
      });
      
      const task3 = new Task({
        title: 'Medium Priority Task',
        priority: 'medium',
        status: 'pending',
        userId
      });
      
      await task1.save();
      await task2.save();
      await task3.save();
      
      const res = await request(app)
        .get('/api/tasks/scheduled')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('scheduledTasks');
      expect(res.body.scheduledTasks.length).toEqual(3);
      expect(res.body.scheduledTasks[0].priority).toEqual('high');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const task = new Task({
        title: 'Original Title',
        description: 'Original Description',
        priority: 'low',
        status: 'pending',
        userId
      });
      
      await task.save();
      
      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          priority: 'high'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('task');
      expect(res.body.task.title).toEqual('Updated Title');
      expect(res.body.task.priority).toEqual('high');
      expect(res.body.task.description).toEqual('Original Description');
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .put(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title'
        });
      
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const task = new Task({
        title: 'Task to Delete',
        priority: 'medium',
        status: 'pending',
        userId
      });
      
      await task.save();
      
      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');

      const found = await Task.findById(task._id);
      expect(found).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
    });
  });
});

