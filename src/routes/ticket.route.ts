import { CreateTicketController } from "../controllers/ticket.controller";


import express from "express";

const ticketRouter = express.Router();


ticketRouter.post("/create", CreateTicketController);


export default ticketRouter;