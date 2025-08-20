import { bcrypt } from "bcrypt";
import axios from "axios";
import { UserDto } from "../dtos/user.dto";
import User from "../models/user.model";
import { Types } from "mongoose";

const externalApi =
  process.env.ERP_MASTER_API ||
  "https://erp.mrgroupofcolleges.co.in/api/get-student/";

const _registerStudent = async (userDto: UserDto): Promise<UserDto> => {
  const { name, email, phone_number, password } = userDto;

  const apiUrl = `${externalApi}${phone_number}`;
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
    // meta: erpResponse.data,
  });

  return newUser.toObject();
};

export { _registerStudent };
