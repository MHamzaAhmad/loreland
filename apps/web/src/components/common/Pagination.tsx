import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className={`flex items-center justify-center space-x-4 py-4 ${className}`}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors
                    ${currentPage <= 1
                        ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent"
                        : "bg-background text-primary border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
            >
                Previous
            </button>
            <span className="text-sm font-medium text-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors
                    ${currentPage >= totalPages
                        ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent"
                        : "bg-background text-primary border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
            >
                Next
            </button>
        </div>
    );
};
