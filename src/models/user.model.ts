import bcrypt from "bcrypt";
import { Schema, model, Document } from "mongoose";
import { UserDto } from "../dtos/user.dto";

const userSchema = new Schema<UserDto & Document>(
  {
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    // email_verification_otp: {
    //   type: String,
    // },
    // otp_expiration: {
    //   type: Date,
    //   default: null,
    // },
    phone_number: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
    next();
  } catch (err) {
    return next(err as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = model<UserDto & Document>("User", userSchema);

export default User;
