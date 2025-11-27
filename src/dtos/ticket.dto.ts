import { Types } from "mongoose";

export enum TicketStatus {
    PENDING = "PENDING",
    REPLY_GIVEN = "REPLY_GIVEN",
    CLOSED = "CLOSED",
}



export interface Remarks {
    title: string;
    subject: string;
    description: string;
    createdAt: Date;
}
export interface TicketDto {
    _id?: Types.ObjectId;
    student_name?: string;
    title: string;
    subject: string;
    description: string;
    status?: TicketStatus;
    allowed_email: string;
    remarks?: Remarks[];
    student: Types.ObjectId;
    meta?: Record<string, any>
    createdAt?: Date;
    updatedAt?: Date;
}
