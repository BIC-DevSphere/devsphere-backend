interface PaginationMeta {
    total: number;
    page: number;
    // limit: number;
    totalPages: number;
    hasNext: boolean;
}

interface PaginationResponseData<T = any> {
    success: true;
    message: string;
    code: number;
    data: T[];
    pagination: PaginationMeta;
}

export default function PaginationResponse<T = any>(
    code: number,
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginationResponseData<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    return {
        success: true,
        message,
        code,
        data,
        pagination: {
            total,
            page,
            // limit,
            totalPages,
            hasNext: hasNext,
        },
    };
}
