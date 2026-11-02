const express = require('express');
const router = express.Router();

const { createTask, updateTask, deleteTask } = require('../controllers/taskControllers');
const authentication = require('../middleware/authMiddleware');

router.post('/', authentication, createTask);
router.post('/tasks', authentication, createTask);
router.post('/createTask', authentication, createTask);

router.put('/:taskId', authentication, updateTask);
router.put('/tasks/:taskId', authentication, updateTask);
router.put('/updateTask/:taskId', authentication, updateTask);

router.delete('/:taskId', authentication, deleteTask);
router.delete('/tasks/:taskId', authentication, deleteTask);
router.delete('/deleteTask/:taskId', authentication, deleteTask);

module.exports = router;
