import {
  registerUserService,
  loginUserService,
} from "./auth.service.js";

export const register = async (req, res) => {
  console.log("REGISTER ROUTE HIT");
  try {
    const user = await registerUserService(req.body);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const data = await loginUserService(req.body);

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};