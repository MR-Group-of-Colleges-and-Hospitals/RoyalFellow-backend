import { Request, Response } from "express";
import {
  _loginForStudent,
  _registerStudent,
  _forgotPasswordService,
  _resetPasswordService,
  _studentDetailsService,
} from "../services/auth.service";
import SuccessResponse from "../middlewares/success.middleware";
import axios, { AxiosError } from "axios";

interface LoginDto {
  email: string;
  password: string;
  phone_number: string;
}

const RegisterStudentController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone_number } = req.body;

    if (!name || !password || !phone_number) {
      return res
        .status(400)
        .json(new SuccessResponse("Missing required fields", 400));
    }

    const student = await _registerStudent({
      name,
      email,
      password,
      phone_number,
    });

    return res
      .status(201)
      .json(
        new SuccessResponse("Student registered successfully", 201, student)
      );
  } catch (err: any) {
    console.error("Error in RegisterStudentController:", err);

    let statusCode = 400;
    if (
      err.message.includes("network") ||
      err.message.includes("timeout") ||
      err.message.includes("connect")
    ) {
      statusCode = 503;
    } else if (
      err.message.includes("not found") ||
      err.message.includes("does not exist")
    ) {
      statusCode = 404;
    }

    return res
      .status(statusCode)
      .json(
        new SuccessResponse(err.message || "Registration failed", statusCode)
      );
  }
};

const LoginStudentController = async (req: Request, res: Response) => {
  try {
    const { email, password, phone_number } = req.body as LoginDto;

    if (!email || !password || !phone_number) {
      return res
        .status(400)
        .json(new SuccessResponse("Missing required fields", 400));
    }

    const loginResult = await _loginForStudent({
      email,
      password,
      phone_number,
    });

    if (!loginResult || !loginResult.success) {
      return res
        .status(401)
        .json(new SuccessResponse(loginResult?.message || "Login failed", 401));
    }

    // If we reach here, login was successful
    return res.status(200).json(
      new SuccessResponse("Login successful", 200, {
        token: loginResult.token,
        student: loginResult.student,
      })
    );
  } catch (err: any) {
    return res
      .status(500)
      .json(new SuccessResponse(err.message || "Internal server error", 500));
  }
};

const StudentDetailsController = async (req: any, res: any) => {
  try {
    const mobile_number = req.body.mobile_number;
    if (!mobile_number) {
      return res
        .status(400)
        .json(new SuccessResponse("Missing mobile number", 400));
    }
    const studentDetails = await _studentDetailsService(mobile_number);
    return res
      .status(200)
      .json(
        new SuccessResponse(
          "Student details fetched successfully",
          200,
          studentDetails
        )
      );
  } catch (err: any) {
    console.log("Error in StudentDetailsController:", err);
    return res
      .status(500)
      .json(new SuccessResponse(err.message || "Internal server error", 500));
  }
};

const ForgotPasswordController = async (req: Request, res: Response) => {
  const { emailOrPhone } = req.body;

  try {
    const message = await _forgotPasswordService(emailOrPhone);
    return res.status(200).json(new SuccessResponse(message, 200));
  } catch (err: any) {
    return res.status(400).json(new SuccessResponse(err.message, 400));
  }
};

const ResetPasswordController = async (req: any, res: any) => {
  const { otp, newPassword } = req.body;

  try {
    const message = await _resetPasswordService(otp, newPassword);
    return res.status(200).json(new SuccessResponse(message, 200));
  } catch (err: any) {
    return res.status(400).json(new SuccessResponse(err.message, 400));
  }
};

export {
  RegisterStudentController,
  LoginStudentController,
  ForgotPasswordController,
  ResetPasswordController,
  StudentDetailsController,
};