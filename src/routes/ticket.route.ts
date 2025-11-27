import { CreateTicketController, FetchTicketsController } from "../controllers/ticket.controller";


import express from "express";

const ticketRouter = express.Router();


ticketRouter.post("/create", CreateTicketController);

ticketRouter.post(
    "/fetch-by-student",
    FetchTicketsController
);






export default ticketRouter;