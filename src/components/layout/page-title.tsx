"use client";

import { useEffect } from "react";

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Zprofile`;
    }
  }, [title]);

  return null;
}
