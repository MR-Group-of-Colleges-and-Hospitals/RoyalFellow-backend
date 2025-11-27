import { CreateTicketController, FetchTicketDetailsController, FetchTicketsController } from "../controllers/ticket.controller";


import express from "express";

const ticketRouter = express.Router();


ticketRouter.post("/create", CreateTicketController);

ticketRouter.post(
    "/fetch-by-student",
    FetchTicketsController
);



ticketRouter.get(
    "/details/:ticketId",
    FetchTicketDetailsController
);





export default ticketRouter;