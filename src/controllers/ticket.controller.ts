


import { _createTicketService } from "../services/ticket.service";


import SuccessResponse from "../middlewares/success.middleware";





const CreateTicketController = async (req: any, res: any) => {
    try {


        const ticket = await _createTicketService(req.body);
        return res
            .status(201)
            .json(new SuccessResponse("Ticket created successfully", 201, ticket));
    } catch (err: any) {
        console.error("Error in CreateTicketController:", err);
        return res
            .status(500)
            .json(new SuccessResponse(err.message || "Ticket creation failed", 500));
    }
};





export { CreateTicketController };