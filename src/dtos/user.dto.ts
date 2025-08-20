import { Types } from "mongoose";

interface UserDto {
  meta?: {
    [key: string]: any;
  };
  _id?: Types.ObjectId;
  name: string;
  email: string;
  phone_number: string;
  //   email_verification_otp: string;
  //   otp_expiration: Date | null;
  password: string;
}

export { UserDto };
