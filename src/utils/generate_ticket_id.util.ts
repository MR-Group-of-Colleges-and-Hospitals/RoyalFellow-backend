import Ticket from "../models/ticket.model";

export const generateTicketSubjectId = async (): Promise<string> => {
    // Count existing tickets
    const count = await Ticket.countDocuments();

    // Next incremental number
    const next = count + 1;

    // If next < 10000 → keep 4 digits, else → 5+ digits automatically
    let padded = "";

    if (next < 10000) {
        padded = next.toString().padStart(4, "0"); // 0001 - 9999
    } else {
        padded = next.toString().padStart(5, "0"); // 10000, 10001, ...
    }

    return `_${padded}`;
};
