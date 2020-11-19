import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useAsyncEffect, useQuery } from "@/utils/hooks";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";

export default function GeoMap() {
  const router = useRouter();
  const query = useQuery();

  const [geographies, setGeographies] = useState([]);
  const [screenSize, setScreenSize] = useState([]);
  const [loading, setLoading] = useState(true);

  const projection = useMemo(() => {
    const [width, height] = screenSize;
    return geoMercator().fitSize([width, height], {
      type: "FeatureCollection",
      features: geographies
    });
  }, [geographies, screenSize]);

  const wrapperRef = useRef(null);

  const handleAreaClick = adcode => {
    router.push(`/maps/${adcode}`)
  };

  useEffect(() => {
    const resizeHandler = () => {
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      setScreenSize([width, height]);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  useAsyncEffect(async () => {
    if (query) {
      const { adcode } = query;
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      const data = await fetch(`/${adcode}.json`);
      const json = await data.json();
      const geojson = feature(json, json.objects[adcode]);
      setGeographies(geojson.features);
      setScreenSize([width, height]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className='map-wrapper' ref={wrapperRef}>
      {!loading ? (
        <svg className='geo-map'>
          {geographies.map((feature, i) => {
            const d = geoPath().projection(projection)(feature);
            const [x, y] = projection(feature.properties.center);
            return (
              <g className='areas' key={`g-${i}`}>
                <path
                  d={d}
                  className='area'
                  onClick={() => handleAreaClick(feature.properties.adcode)}
                />
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