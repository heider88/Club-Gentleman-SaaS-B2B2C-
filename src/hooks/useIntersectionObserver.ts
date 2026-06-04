"use client";
import { useEffect, useState, useRef, RefObject } from "react";

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [RefObject<HTMLElement | null>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (targetRef.current) {
          observer.unobserve(targetRef.current);
        }
      }
    }, options);

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options, options.rootMargin, options.threshold]);

  return [targetRef, isIntersecting];
}
