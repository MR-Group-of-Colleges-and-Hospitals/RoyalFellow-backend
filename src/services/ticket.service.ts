import Ticket from "../models/ticket.model";
import { TicketDto, TicketStatus } from "../dtos/ticket.dto";

import { generateTicketSubjectId } from "../utils/generate_ticket_id.util";
import { Types } from "mongoose";
import User from "../models/user.model";
import { sendTicketCreationEmail } from "../utils/email_service.util";

const _createTicketService = async (data: Partial<TicketDto>) => {
    const subjectId = await generateTicketSubjectId();
    const student = await User.findOne({ name: data.student_name });
    if (!student) {
        throw new Error("Student not found");
    };

    const payload: Partial<TicketDto> = {
        title: data.title || "",
        subject: subjectId,
        description: data.description || "",
        remarks: data.remarks || "",
        allowed_email: data.allowed_email!,
        student: student._id as Types.ObjectId,
        status: TicketStatus.PENDING,
        meta: data.meta || {},
    };

    const newTicket = await Ticket.create(payload);
    await sendTicketCreationEmail({
        to: payload.allowed_email!,
        subject: payload.subject!,
        title: payload.title!,
        description: payload.description!,
        remarks: payload.remarks,
        studentName: data.meta?.studentName || "",
    });
    return newTicket;
};



export { _createTicketService };
