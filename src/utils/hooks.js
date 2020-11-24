import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

export const useAsyncEffect = (fn, dependencies) => {
  useEffect(() => {
    fn();
  }, dependencies);
};

export const useQuery = () => {
  const router = useRouter();

  const hasQueryParams =
    /\[.+\]/.test(router.route) || /\?./.test(router.asPath);
  const ready = !hasQueryParams || Object.keys(router.query).length > 0;

  if (!ready) return null;

  return router.query;
};

export const useAnimationFrame = (callback, flags) => {
  const previousRef = useRef();
  const requestRef = useRef();

  const animate = time => {
    if (previousRef.current) {
      const deltaTime = time - previousRef.current;
      callback(deltaTime);
    }

    previousRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (flags.every(flag => flag)) {
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(requestRef.current);
      };
    }
  }, flags);
};
