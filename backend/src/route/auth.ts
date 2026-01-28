// routes/auth.ts
import express from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { loginSchema, changePasswordSchema } from "../schema/auth";
import { login, refresh, logout, changePassword } from "../controller/auth";

const authRouter = express.Router();

authRouter.post("/login", validate({ body: loginSchema }), login);

authRouter.post("/refresh", refresh); 

authRouter.post("/logout", logout);

authRouter.post(
  "/change-password", 
  authenticate, 
  validate({ body: changePasswordSchema }), 
  changePassword
);

export { authRouter };
