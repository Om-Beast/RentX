import User from "../../models/User.js";

export const findUserByEmail = async (email) => {
  console.log("SEARCHING EMAIL:", email);

  const user = await User.findOne({ email });

  console.log("FOUND USER:", user);

  return user;
};

export const createUser = async (data) => {
  console.log("CREATE USER CALLED");

  const user = await User.create(data);

  console.log("CREATED USER:", user);

  return user;
};

export const findUserById = async (id) => {
  return await User.findById(id);
};