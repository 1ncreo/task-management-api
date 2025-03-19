const express = require('express');
const Task = require('../models/Task');
const { check, validationResult } = require('express-validator');
const { cacheMiddleware, clearUserCache } = require('../middleware/auth');
const PriorityQueue = require('../utils/PriorityQueue');
const router = express.Router();

const getPriorityValue = (priority) => {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2;
  }
};

router.post('/', [
  check('title').notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  check('description').optional().isLength({ max: 500 }),
  check('priority').isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  check('status').isIn(['pending', 'completed']).withMessage('Status must be pending or completed')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, priority = 'medium', status = 'pending' } = req.body;
    
    const task = new Task({
      title,
      description,
      priority,
      status,
      userId: req.user.id
    });

    await task.save();

    clearUserCache(req.user.id);
    
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    
    if (req.query.status && ['pending', 'completed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    
    if (req.query.priority && ['low', 'medium', 'high'].includes(req.query.priority)) {
      filter.priority = req.query.priority;
    }

    const total = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      tasks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/scheduled', cacheMiddleware(300), async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.user.id,
      status: 'pending'
    });

    const taskQueue = new PriorityQueue();
    tasks.forEach(task => {
      const priorityValue = getPriorityValue(task.priority);
      const timestamp = new Date(task.createdAt).getTime();
      const score = (priorityValue * 10000000) - (Date.now() - timestamp) / 1000;
      
      taskQueue.enqueue(task, score);
    });

    const scheduledTasks = [];
    while (!taskQueue.isEmpty()) {
      scheduledTasks.push(taskQueue.dequeue().element);
    }
    
    res.json({
      scheduledTasks,
      count: scheduledTasks.length
    });
  } catch (error) {
    console.error('Error scheduling tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', cacheMiddleware(300), async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', [
  check('title').optional().isLength({ max: 100 }),
  check('description').optional().isLength({ max: 500 }),
  check('priority').optional().isIn(['low', 'medium', 'high']),
  check('status').optional().isIn(['pending', 'completed'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, priority, status } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        $set: { 
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(priority && { priority }),
          ...(status && { status }),
          updatedAt: Date.now()
        } 
      },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    clearUserCache(req.user.id);
    
    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    clearUserCache(req.user.id);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;