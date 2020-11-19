import { useEffect } from "react";
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
