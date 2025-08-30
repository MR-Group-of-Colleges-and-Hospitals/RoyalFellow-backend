import bcrypt from "bcrypt";
import axios from "axios";
import { UserDto } from "../dtos/user.dto";
import User from "../models/user.model";
import { generateAccessToken } from "../utils/jwt.utils";
import { generateOTP } from "../utils/random_digit_generator.util";
import { LoginDto } from "../dtos/login.dto";
import { sendEmail } from "../utils/email_service.util";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

const templatePath = path.join(__dirname, "../templates/otp_email.html");
const templateSource = fs.readFileSync(templatePath, "utf8");
const template = handlebars.compile(templateSource);


const _registerStudent = async (userDto: UserDto): Promise<UserDto> => {
  const { name, email, phone_number, password } = userDto;

  try {
    const apiUrl = `https://erp.mrgroupofcolleges.co.in/api/get-student/${phone_number}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    console.log(`Fetching student data from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    // console.log(response.status, "response");

    clearTimeout(timeoutId);

    // Check if response is OK
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Student not found in ERP system.");
      }
      throw new Error(
        `ERP API returned status: ${response.status} ${response.statusText}`
      );
    }

    const erpResponse = await response.json();

    console.warn(erpResponse.status, "lelel");

    if (erpResponse.status == false) {
      throw new Error("Student not found in ERP system.");
    }

    const existingUser = await User.findOne({ phone_number });
    if (existingUser) {
      throw new Error("Student already registered.");
    }

    const newUser = await User.create({
      name,
      email,
      phone_number,
      password,
    });

    return newUser.toObject();
  } catch (error: any) {
    console.error("Error in _registerStudent:", error);

    // Handle specific fetch errors
    if (error.name === "AbortError") {
      throw new Error("Request to ERP system timed out. Please try again.");
    }

    if (error.name === "TypeError") {
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        throw new Error(
          "Network error: Unable to connect to ERP system. Please check your connection."
        );
      }
    }

    if (error.message.includes("not found") || error.message.includes("404")) {
      throw new Error("Student does not exist in our records!");
    }

    throw new Error(error.message || "Registration failed");
  }
};
const _loginForStudent = async (loginDto: LoginDto) => {
  const { email, password, phone_number } = loginDto;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const apiUrl = `https://erp.mrgroupofcolleges.co.in/api/get-student/${phone_number}`;
    const { data: erpResponse } = await axios.get(apiUrl);

    if (!erpResponse?.status) {
      throw new Error("Student not found in ERP system");
    }

    const token = generateAccessToken(user._id);

    return {
      token,
      student: erpResponse.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Login failed",
    };
  }
};


const _forgotPasswordService = async (
  emailOrPhone: string
): Promise<string> => {
  const isPhone = /^\d{10}$/.test(emailOrPhone);
  const query = isPhone
    ? { phone_number: emailOrPhone }
    : { email: emailOrPhone };

  const user = await User.findOne(query);
  if (!user) {
    throw new Error("User not found with provided credentials.");
  }

  const otp = generateOTP();
  const expiration = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes


  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        "meta.forgot_password_otp": otp,
        "meta.forgot_password_otp_expiration": expiration,
      },
    },
    { new: true }
  );

  if (isPhone) {
    // Send OTP via SMS
    // await client.messages.create({
    //   body: `Your OTP to reset password is ${otp}. It will expire in 2 minutes.`,
    //   from: twilioPhoneNumber,
    //   to: user.phone_number.startsWith("+")
    //     ? user.phone_number
    //     : `+91${user.phone_number}`,
    // });
  } else {
    // Send OTP via Email
    const emailSubject = "Reset Password OTP";
    const emailText = `Your OTP is ${otp}. It will expire in 2 minutes.`;
    const emailHtml = template({ username: user.name, OTP: otp });

    await sendEmail(user.email, emailSubject, emailText, emailHtml);
  }

  return "OTP sent successfully.";
};


const _resetPasswordService = async (
  otp: string,
  newPassword: string
): Promise<string> => {
  const user = await User.findOne({
    "meta.forgot_password_otp": otp,
  });

  if (!user) {
    throw new Error("Invalid OTP.");
  }

  const now = new Date();
  const expiration = new Date(user.meta?.forgot_password_otp_expiration);

  if (expiration.getTime() < now.getTime()) {
    throw new Error("OTP has expired.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        password: hashedPassword,
        "meta.forgot_password_otp": "",
        "meta.forgot_password_otp_expiration": null,
      },
    },
    { new: true }
  );

  return "Password reset successfully.";
};



export { _registerStudent, _loginForStudent, _forgotPasswordService, _resetPasswordService };
