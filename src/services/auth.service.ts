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
    throw new Error(error.message || "Registration failed");
  }
};


const _loginForStudent = async (loginDto: Partial<LoginDto>) => {
  const { password, phone_number } = loginDto;

  try {
    if (!password) throw new Error("Password is required");


    const user = await User.findOne({ phone_number });
    if (!user) throw new Error("User not found");
    if (!user.password) throw new Error("User password not found");


    let isMatch = false;
    isMatch = await bcrypt.compare(password, user.password);


    if (!isMatch) throw new Error("Invalid password");


    // const apiUrl = `https://erp.mrgroupofcolleges.co.in/api/get-student/${phone_number}`;
    // const { data: erpResponse } = await axios.get(apiUrl);

    // if (!erpResponse?.status) throw new Error("Student not found in ERP");

    // JWT TOKEN
    const token = generateAccessToken(user._id);

    return {
      success: true,
      token,
      student: user,
    };

  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, message: error.message };
  }
};


const _studentDetailsService = async (mobile_number: string) => {
  const apiUrl = `https://erp.mrgroupofcolleges.co.in/api/get-student/${mobile_number}`;
  try {
    const { data: erpResponse } = await axios.get(apiUrl, { timeout: 15000 });

    if (!erpResponse?.status) {
      throw new Error("Student not found in ERP system");
    }
    return erpResponse.data;
  } catch (error: any) {
    console.log("Error in _studentDetailsService:", error);
    throw new Error(
      error.message || "Failed to fetch student details from ERP"
    );
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


const _studentProfileService = async (student_name: string) => {
  const student = await User.findOne({
    name: student_name
  }).select("-password");
  if (!student) {
    throw new Error("Student not found.");
  }
  return student;
}


const _updateStudentEmailService = async (student_name: string, email: string) => {

  const student = await User.findOne({ name: student_name });
  if (!student) {
    throw new Error("Student not found.");
  }
  student.email = email;
  await student.save();

  return student;
};

export {
  _registerStudent,
  _loginForStudent,
  _forgotPasswordService,
  _resetPasswordService,
  _studentDetailsService,
  _studentProfileService,
  _updateStudentEmailService
};
