import {
  LoginStudentController,
  RegisterStudentController,
  ForgotPasswordController,
  ResetPasswordController,
  StudentDetailsController,
  StudentProfileController
} from "../controllers/auth.controller";

import express from "express";

const authRouter = express.Router();

authRouter.post("/register", RegisterStudentController);
authRouter.post("/login", LoginStudentController);
authRouter.post("/forget-password", ForgotPasswordController);
authRouter.post("/reset-password", ResetPasswordController);
authRouter.post("/student-details", StudentDetailsController);
authRouter.get("/student-profile/:studentId", StudentProfileController);



export default authRouter;
