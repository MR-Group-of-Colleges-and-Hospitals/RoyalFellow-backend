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

    console.log(student, 'student found in ticket service');

    const payload: Partial<TicketDto> = {
        title: data.title || "",
        subject: subjectId,
        description: data.description || "",
        // remarks: data.remarks || "",
        allowed_email: data.allowed_email!,
        student: student._id as Types.ObjectId,
        status: TicketStatus.PENDING,
        meta: data.meta || {},
    };

    console.log(payload, 'payload for ticket creation');

    const newTicket = await Ticket.create(payload);

    console.log(newTicket, 'new ticket created');
    // await sendTicketCreationEmail({
    //     to: payload.allowed_email!,
    //     subject: payload.subject!,
    //     title: payload.title!,
    //     description: payload.description!,
    //     // remarks: payload.remarks,
    //     studentName: data.meta?.studentName || "",
    // });
    return newTicket;
};



const _fetchTicketsByStudentService = async (studentName: string, page: number = 1, limit: number = 10) => {

    const skip = (page - 1) * limit;

    const existingStudent = await User.findOne({
        name: studentName
    });
    if (!existingStudent) {
        throw new Error("Student not found");
    }

    const [tickets, total] = await Promise.all([
        Ticket.find({
            student: existingStudent?._id
        }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Ticket.countDocuments({
            student: existingStudent?._id
        }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        tickets,
        pagination: {
            totalItems: total,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage,
            hasPrevPage,
        },
    };


}



export { _createTicketService, _fetchTicketsByStudentService };
