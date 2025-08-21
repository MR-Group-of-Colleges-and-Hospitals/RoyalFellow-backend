import { Request, Response } from "express";
import { _loginForStudent, _registerStudent } from "../services/auth.service";

import SuccessResponse from "../middlewares/success.middleware";

interface LoginDto {
  email: string;
  password: string;
  phone_number: string;
}

const RegisterStudentController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone_number } = req.body;

    if (!name || !email || !password || !phone_number) {
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
      statusCode = 503; // Service Unavailable
    } else if (
      err.message.includes("not found") ||
      err.message.includes("does not exist")
    ) {
      statusCode = 404; // Not Found
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

    if (!loginResult || loginResult.success === false) {
      return res
        .status(401)
        .json(new SuccessResponse(loginResult.message || "Login failed", 401));
    }

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

export { RegisterStudentController, LoginStudentController };
