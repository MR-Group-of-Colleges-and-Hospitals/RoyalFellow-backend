import bcrypt from "bcrypt";
import axios from "axios";
import { UserDto } from "../dtos/user.dto";
import User from "../models/user.model";
import { generateAccessToken } from "../utils/jwt.utils";
import { LoginDto } from "../dtos/login.dto";

const externalApi = (
  process.env.ERP_MASTER_API ||
  "https://erp.mrgroupofcolleges.co.in/api/get-student/"
).replace(/\/$/, "");

const _registerStudent = async (userDto: UserDto): Promise<UserDto> => {
  const { name, email, phone_number, password } = userDto;

  try {
    const apiUrl = `${externalApi}/${phone_number}`;
    const { data: erpResponse } = await axios.get(apiUrl);

    if (!erpResponse.status) {
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
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error("Student does not exist in our records!");
    }
    console.log(error);

    throw new Error(error.message);
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

    const apiUrl = `${externalApi}${phone_number}`;
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

export { _registerStudent, _loginForStudent };
