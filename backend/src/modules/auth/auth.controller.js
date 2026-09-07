import { registerUserService, loginUserService } from "./auth.service.js";

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await registerUserService({ name, email, password, role });
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginUserService({ email, password });
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};