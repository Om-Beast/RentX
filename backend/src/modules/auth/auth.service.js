import generateToken from "../../utils/generateToken.js";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createUser,
} from "./auth.repository.js";

export const registerUserService = async ({
  name,
  email,
  password,
  role,
}) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    role,
  });

  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

export const loginUserService = async ({
  email,
  password,
}) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(
  password,
  user.password
);

console.log("PASSWORD ENTERED =", password);
console.log("HASH IN DB =", user.password);
console.log("MATCH =", isMatch);

if (!isMatch) {
  throw new Error("Invalid credentials");
}

  const token = generateToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    token,
  };
};