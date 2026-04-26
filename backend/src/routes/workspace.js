const express = require('express');
const router = express.Router();
const { createWorkspace, getWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace, getDashboard } = require('../controllers/workspaceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspace);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.get('/:id/dashboard', getDashboard);

module.exports = router;
