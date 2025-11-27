


import { _createTicketService, _fetchTicketDetailsService, _fetchTicketsByStudentService } from "../services/ticket.service";


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


const FetchTicketsController = async (req: any, res: any) => {
    try {
        const page = parseInt(req.body.page as string) || 1;
        const limit = parseInt(req.body.limit as string) || 10;
        const {
            student_name
        } = req.body;


        const tickets = await _fetchTicketsByStudentService(student_name, page, limit);
        return res
            .status(200)
            .json(new SuccessResponse("Tickets fetched successfully", 200, tickets));
    } catch (error: any) {
        return res.status(500).json(new SuccessResponse(error.message, 500));
    }
};


const FetchTicketDetailsController = async (req: any, res: any) => {
    try {
        const ticketId = req.params.ticketId;

        const result = await _fetchTicketDetailsService(ticketId);
        if(!result) {
            return res
            .status(404)
            .json(new SuccessResponse("Ticket not found", 404));
        }
        return res
            .status(200)
            .json(new SuccessResponse("Ticket details fetched successfully", 200, result));
    } catch (error: any) {
        return res.status(500).json(new SuccessResponse(error.message, 500));
    }
};



export { CreateTicketController, FetchTicketsController, FetchTicketDetailsController };