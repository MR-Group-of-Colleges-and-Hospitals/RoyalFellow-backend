import { Request, Response } from "express";
import { _loginForStudent, _registerStudent } from "../services/auth.service";
import SuccessResponse from "../middlewares/success.middleware";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

// Extend AxiosRequestConfig to include retry properties
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retry?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface LoginDto {
  email: string;
  password: string;
  phone_number: string;
}

// Create axios instance with retry configuration
const axiosWithRetry = axios.create();

// Add retry interceptor
axiosWithRetry.interceptors.response.use(undefined, (error: AxiosError) => {
  const config = error.config as CustomAxiosRequestConfig;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }

  config.retryCount = config.retryCount || 0;

  if (config.retryCount >= config.retry) {
    return Promise.reject(error);
  }

  config.retryCount += 1;

  return new Promise((resolve) => {
    setTimeout(
      () => resolve(axiosWithRetry(config)),
      config.retryDelay || 2000
    );
  });
});

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

const StudentDetailsController = async (req: any, res: any) => {
  try {
    const { mobile } = req.params;

    // Use environment variable for API URL with fallback
    const API_BASE_URL =
      process.env.ERP_API_URL || "https://erp.mrgroupofcolleges.co.in";

    // Call Laravel API with timeout and retry configuration
    const response = await axiosWithRetry.get(
      `${API_BASE_URL}/api/get-student/${mobile}`,
      {
        timeout: 15000, // 15 seconds timeout
        retry: 3, // Retry 3 times
        retryDelay: 2000, // Wait 2 seconds between retries
        headers: {
          "User-Agent": "Student-Dashboard-Backend/1.0.0",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate, br",
        },
      } as CustomAxiosRequestConfig
    );

    // Send back data to client
    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching student:", error);

    // More specific error handling
    if (error.code === "ETIMEDOUT" || error.code === "ENETUNREACH") {
      res.status(504).json({
        success: false,
        error: "external_service_timeout",
        message:
          "The student information service is currently unavailable. Please try again later.",
      });
    } else if (error.response) {
      // The request was made and the server responded with a status code
      res.status(error.response.status).json({
        success: false,
        error: "external_api_error",
        message: "External API returned an error",
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        success: false,
        error: "service_unavailable",
        message:
          "Could not connect to student information service. Please check your network connection.",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "internal_server_error",
        message: "Failed to fetch student information",
      });
    }
  }
};

export {
  RegisterStudentController,
  LoginStudentController,
  StudentDetailsController,
};