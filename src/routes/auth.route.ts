import {
  LoginStudentController,
  RegisterStudentController,
  ForgotPasswordController,
  ResetPasswordController
} from "../controllers/auth.controller";

import express from "express";

const authRouter = express.Router();

authRouter.post("/register", RegisterStudentController);
authRouter.post("/login", LoginStudentController);
authRouter.post("/forget-password", ForgotPasswordController);
authRouter.post("/reset-password", ResetPasswordController);



export default authRouter;
