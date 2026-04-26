const express = require('express');
const router = express.Router({ mergeParams: true });
const { createProblem, getProblems, getProblem, updateProblem, deleteProblem } = require('../controllers/problemController');
const { notifyNearestVolunteer } = require('../controllers/notifyController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', createProblem);
router.get('/', getProblems);
router.get('/:pid', getProblem);
router.put('/:pid', updateProblem);
router.delete('/:pid', deleteProblem);
router.post('/:pid/notify', notifyNearestVolunteer);

module.exports = router;
