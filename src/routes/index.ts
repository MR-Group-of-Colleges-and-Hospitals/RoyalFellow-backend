import express, { Router } from "express";

const mainRouter: Router = express.Router();

import authRouter from "./auth.route";

mainRouter.use("/auth", authRouter);

export default mainRouter;
