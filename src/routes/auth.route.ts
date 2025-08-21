import {
  LoginStudentController,
  RegisterStudentController,
  StudentDetailsController,
} from "../controllers/auth.controller";

import express from "express";

const authRouter = express.Router();

authRouter.post("/register", RegisterStudentController);
authRouter.post("/login", LoginStudentController);

authRouter.get("/student-details/:mobile", StudentDetailsController);

export default authRouter;
