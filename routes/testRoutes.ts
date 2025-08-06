const express = require('express');
import { Request, Response } from 'express';

const router = express.Router();

router.route('/').get((req: Request, res: Response) => {
    res.send('This is a test route');
}); 

module.exports = router;