import { useEffect, useState } from "react";

export const usePortal = () => {
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPortalRoot(document.body);
        }
    }, []);

    return portalRoot;
};