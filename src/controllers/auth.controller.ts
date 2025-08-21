import { Request, Response } from "express";
import { _loginForStudent, _registerStudent } from "../services/auth.service";
import SuccessResponse from "../middlewares/success.middleware";
import axios, { AxiosError } from "axios";

interface LoginDto {
  email: string;
  password: string;
  phone_number: string;
}

// Create custom axios instance with better configuration
const apiClient = axios.create();

// Add request interceptor for better logging
apiClient.interceptors.request.use((config) => {
  console.log(`Making API call to: ${config.url}`);
  console.log(`Method: ${config.method}, Timeout: ${config.timeout}ms`);
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `API call successful: ${response.status} ${response.statusText}`
    );
    return response;
  },
  (error: AxiosError) => {
    console.error("API call failed:", {
      code: error.code,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
    });
    return Promise.reject(error);
  }
);

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

const StudentDetailsController = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.params;
    const API_BASE_URL =
      process.env.ERP_API_URL || "https://erp.mrgroupofcolleges.co.in";

    console.log(`Fetching student data for mobile: ${mobile}`);
    console.log(`External API URL: ${API_BASE_URL}`);

    // Solution 1: Use axios with proper configuration for cross-server communication
    const response = await apiClient.get(
      `${API_BASE_URL}/api/get-student/${mobile}`,
      {
        timeout: 25000, // 25 seconds timeout
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't reject on server errors
        headers: {
          "User-Agent": "Student-Dashboard-Backend/1.0.0",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        },
      }
    );

    console.log("External API response received:", response.status);

    // Send back the data exactly as received from external API
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Error in StudentDetailsController:", {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    // Detailed error analysis
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        error: "connection_refused",
        message: "The external service is not accepting connections",
        details: "Check if the external API server is running and accessible",
      });
    } else if (error.code === "ETIMEDOUT") {
      return res.status(504).json({
        success: false,
        error: "connection_timeout",
        message: "The external service took too long to respond",
        details: "The API server might be overloaded or network issues exist",
      });
    } else if (error.code === "ENOTFOUND") {
      return res.status(502).json({
        success: false,
        error: "dns_resolution_failed",
        message: "Could not resolve the external service hostname",
        details: "Check the API URL and DNS configuration",
      });
    } else if (error.response) {
      // External API responded with error status
      return res.status(error.response.status).json({
        success: false,
        error: "external_api_error",
        message: "External API returned an error",
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      return res.status(502).json({
        success: false,
        error: "no_response",
        message: "No response received from external service",
        details: "Network connectivity issue between servers",
      });
    } else {
      // Other errors
      return res.status(500).json({
        success: false,
        error: "internal_error",
        message: "Unexpected error occurred",
        details: error.message,
      });
    }
  }
};

// Add diagnostic endpoint
const DiagnosticController = async (req: Request, res: Response) => {
  try {
    const API_BASE_URL =
      process.env.ERP_API_URL || "https://erp.mrgroupofcolleges.co.in";

    const results = {
      timestamp: new Date().toISOString(),
      render_service: "student-dashboard-backend-microservice",
      external_api: API_BASE_URL,
      status: "testing",
    };

    // Test basic connectivity
    try {
      const response = await axios.get(API_BASE_URL, {
        timeout: 10000,
        headers: { "User-Agent": "Diagnostic-Tool/1.0.0" },
      });
      results.status = "connected";
      results["response_status"] = response.status;
    } catch (testError: any) {
      results.status = "failed";
      results["error"] = {
        code: testError.code,
        message: testError.message,
      };
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({
      error: "diagnostic_failed",
      message: error.message,
    });
  }
};

export {
  RegisterStudentController,
  LoginStudentController,
  StudentDetailsController,
  DiagnosticController,
};