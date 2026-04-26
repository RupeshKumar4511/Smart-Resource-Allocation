const express = require('express');
const router = express.Router({ mergeParams: true });
const { createVolunteer, getVolunteers, getVolunteer, updateVolunteer, deleteVolunteer } = require('../controllers/volunteerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', createVolunteer);
router.get('/', getVolunteers);
router.get('/:vid', getVolunteer);
router.put('/:vid', updateVolunteer);
router.delete('/:vid', deleteVolunteer);

module.exports = router;
