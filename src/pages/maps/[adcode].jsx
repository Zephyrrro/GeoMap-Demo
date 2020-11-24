import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAnimationFrame, useAsyncEffect, useQuery } from "@/utils/hooks";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";

export default function GeoMap() {
  const router = useRouter();
  const query = useQuery();

  const [geographies, setGeographies] = useState([]);
  const [points, setPoints] = useState([]);
  const [screenSize, setScreenSize] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animationFlag, setAnimationFlag] = useState(false)

  const projection = useMemo(() => {
    const [width, height] = screenSize;
    return geoMercator().fitSize([width, height], {
      type: "FeatureCollection",
      features: geographies
    });
  }, [geographies, screenSize]);

  const wrapperRef = useRef(null);

  const handleAreaClick = adcode => {
    router.push(`/maps/${adcode}`);
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

  useAnimationFrame(() => {
    setPoints(prev =>
      prev.map(point => ({
        ...point,
        r: point.r - 0.2 < 0 ? 50 : point.r - 0.2
      }))
    );
  }, [animationFlag]);

  useAsyncEffect(async () => {
    if (query) {
      const { adcode } = query;
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      const data = await fetch(`/${adcode}.json`);
      const json = await data.json();
      const geojson = feature(json, json.objects[adcode]);
      const features = geojson.features.map(feature => {
        const { properties } = feature;
        const showPoint =
          properties.name.endsWith("市") ||
          properties.name.endsWith("台湾省") ||
          properties.name.endsWith("行政区");

        return {
          ...feature,
          properties: {
            ...properties,
            showPoint
          }
        };
      });
      const points = features
        .filter(feature => feature.properties.showPoint)
        .map(item => ({
          adcode: item.properties.adcode,
          coordinate: item.properties.center,
          r: 50
        }));

      setGeographies(features);
      setPoints(points);
      setScreenSize([width, height]);
      setLoading(false);
      setAnimationFlag(points.length !== 0)
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
              <g className='areas' key={`area-${i}`}>
                <path
                  d={d}
                  className='area'
                  onClick={() => handleAreaClick(feature.properties.adcode)}
                />
                {feature.properties.showPoint ? null : (
                  <text x={x} y={y} className='area-name'>
                    {feature.properties.name}
                  </text>
                )}
              </g>
            );
          })}
          {points.map((point, i) => {
            const { coordinate, r, adcode } = point;
            const [cx, cy] = projection(coordinate);
            return (
              <g className='points' key={`point-${i}`}>
                <circle
                  className='point'
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill='#3388a7'
                  strokeWidth={r}
                  stroke={`rgba(51, 136, 167, ${1 - r / 50})`}
                  onClick={() => handleAreaClick(adcode)}
                />
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
