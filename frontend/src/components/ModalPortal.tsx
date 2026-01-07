"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
    children: React.ReactNode;
    show: boolean;
}

export function ModalPortal({ children, show }: ModalPortalProps) {
    const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!show) {
            setPortalElement(null);
            return;
        }

        if (typeof document === "undefined") {
            return;
        }

        let element = document.getElementById("modal-portal") as HTMLDivElement | null;

        if (!element) {
            element = document.createElement("div");
            element.id = "modal-portal";
            element.style.position = "fixed";
            element.style.top = "0";
            element.style.left = "0";
            element.style.zIndex = "99999";
            document.body.appendChild(element);
        }

        element.style.pointerEvents = "auto";
        setPortalElement(element);

        return () => {
            if (element) {
                element.style.pointerEvents = "none";
            }
            setPortalElement(null);
        };
    }, [show]);

    if (!show || !portalElement) {
        return null;
    }

    return createPortal(children, portalElement);
}
