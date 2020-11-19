import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { useAsyncEffect } from "@/utils/hooks";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";

export default function Index() {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const [geographies, setGeographies] = useState([]);
  const [screenSize, setScreenSize] = useState([]);
  const projection = useMemo(() => {
    const [width, height] = screenSize;
    return geoMercator().fitSize([width, height], {
      type: "FeatureCollection",
      features: geographies
    });
  }, [geographies, screenSize]);
  const [loading, setLoading] = useState(true);

  

  useAsyncEffect(async () => {
    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const data = await fetch("/China.json");
    const json = await data.json();
    const geojson = feature(json, json.objects.China);

    const resizeHandler = () => {
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      setScreenSize([width, height]);
    };

    window.addEventListener("resize", resizeHandler);

    setGeographies(geojson.features);
    setScreenSize([width, height]);
    setLoading(false);

    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, []);

  return (
    <div className='map-wrapper' ref={wrapperRef}>
      {!loading ? (
        <svg className='geo-map'>
          {geographies.map((feature, i) => {
            const d = geoPath().projection(projection)(feature);
            const [x, y] = projection(feature.properties.center);
            return (
              <g className='areas' key={`g-${i}`}>
                <path d={d} className='area' />
                <text x={x} y={y} className='area-name'>
                  {feature.properties.name}
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
