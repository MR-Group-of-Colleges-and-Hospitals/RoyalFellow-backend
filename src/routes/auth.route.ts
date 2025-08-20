import { RegisterStudentController } from "../controllers/auth.controller";

import express from "express";

const authRouter = express.Router();

authRouter.post("/register", RegisterStudentController);

export default authRouter;
