import { useEffect, useRef } from "react";
import anime from "animejs";

export function PageTransition({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 350,
      easing: "easeOutCubic",
    });
  }, []);
  return <div ref={ref} className="h-full">{children}</div>;
}
