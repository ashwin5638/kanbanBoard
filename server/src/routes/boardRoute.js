const express = require('express');
const router = express.Router();
const {createBoard,getBoards,getBoardById} = require('../controllers/boardControllers');
const authenticateToken = require('../middleware/authMiddleware');
const verifyTenantAccess = require('../middleware/tenantMiddleware');



router.use(authenticateToken);
router.use(verifyTenantAccess);


router.get('/getBoard', getBoards);
router.post('/createBoard', createBoard);
router.get('/:boardId', getBoardById);

module.exports = router;