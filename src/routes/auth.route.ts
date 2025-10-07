import {
  LoginStudentController,
  RegisterStudentController,
  ForgotPasswordController,
  ResetPasswordController,
  StudentDetailsController
} from "../controllers/auth.controller";

import express from "express";

const authRouter = express.Router();

authRouter.post("/register", RegisterStudentController);
authRouter.post("/login", LoginStudentController);
authRouter.post("/forget-password", ForgotPasswordController);
authRouter.post("/reset-password", ResetPasswordController);
authRouter.post("/student-details", StudentDetailsController);



export default authRouter;
