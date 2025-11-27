import { Schema, model, Document } from "mongoose";
import { TicketDto, TicketStatus } from "../dtos/ticket.dto";

const ticketSchema = new Schema<TicketDto & Document>(
    {
        title: {
            type: String,
            default: "",
        },
        subject: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: Object.values(TicketStatus),
            default: TicketStatus.PENDING,
        },
        remarks: [
            {
                title: { 
                    type: String, 
                    default: "" 
                },
                subject: { type: String, default: "" },
                description: { type: String, default: "" },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        allowed_email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        meta: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Ticket = model<TicketDto & Document>("Ticket", ticketSchema);

export default Ticket;
