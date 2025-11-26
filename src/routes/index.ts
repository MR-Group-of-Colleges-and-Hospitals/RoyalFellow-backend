import express, { Router } from "express";

const mainRouter: Router = express.Router();

import authRouter from "./auth.route";
import tickeRouter from "./ticket.route";

mainRouter.use("/auth", authRouter);
mainRouter.use("/ticket", tickeRouter);

export default mainRouter;
