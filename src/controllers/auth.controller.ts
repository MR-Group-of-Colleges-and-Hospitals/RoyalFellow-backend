import { Request, Response } from "express";
import { _registerStudent } from "../services/auth.service";

import SuccessResponse from "../middlewares/success.middleware";

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
    return res
      .status(400)
      .json(new SuccessResponse(err.message || "Registration failed", 400));
  }
};

export { RegisterStudentController };
