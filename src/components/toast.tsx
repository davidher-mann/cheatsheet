import React from "react";
import classNames from "classnames";

export const Toast = ({ text, isError = false }: { text: string; isError?: boolean }) => {

    return (
        <div
            className={classNames(
                "fixed z-10 p-4 m-4 font-medium text-white rounded-lg shadow-lg top-20 right-6",
                isError ? "bg-red-600" : "bg-primary"
            )}
            role="alert"
        >
            <p className="text-sm">
                {isError
                    ? (text.startsWith("Failed") ? text : `Failed to copy "${text}" to clipboard`)
                    : `"${text}" copied into your clipboard `}
            </p>
        </div>
    );
};