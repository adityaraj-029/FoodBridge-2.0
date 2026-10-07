import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../services/socket";
import DashboardLayout from "../components/DashboardLayout";
import { getUserInfo } from "../context/useUserInfo";

const MAP_SCRIPT_ID = "foodbridge-google-maps-script";

function getNavItems(role) {
  if (role === "donor") {
    return [
      { path: "/donor-dashboard", label: "List Food", icon: "📝" },
      { path: "/my-donations", label: "Your Donations", icon: "📦" },
      { path: "/donor-profile", label: "Profile", icon: "👤" },
      { path: "/donor-certificates", label: "Certificates", icon: "🏆" },
    ];
  }

  if (role === "ngo") {
    return [{ path: "/ngo-dashboard", label: "Dashboard", icon: "📊" }];
  }

  if (role === "volunteer") {
    return [{ path: "/volunteer-dashboard", label: "My Tasks", icon: "🚚" }];
  }

  return [];
}

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }

  const existingScript = document.getElementById(MAP_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener(
        "load",
        () => resolve(window.google.maps),
        {
          once: true,
        },
      );
      existingScript.addEventListener(
        "error",
        () => {
          reject(new Error("Google Maps failed to load."));
        },
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
}

function TrackDelivery() {
  const { donationId } = useParams();
  const userInfo = getUserInfo();
  const [location, setLocation] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [mapError, setMapError] = useState("");

  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerPositionRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const eventName = `tracking-${donationId}`;

    const handleLocation = (data) => {
      if (!data) return;
      setLocation(data);
    };

    const handleConnect = () => {
      setConnected(true);
      socket.emit("joinTracking", { donationId });
    };

    const handleDisconnect = () => setConnected(false);

    socket.on(eventName, handleLocation);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      socket.emit("joinTracking", { donationId });
    } else {
      socket.connect();
    }

    return () => {
      socket.emit("leaveTracking", { donationId });
      socket.off(eventName, handleLocation);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [donationId]);

  useEffect(() => {
    if (!location || !mapElementRef.current) return undefined;

    let cancelled = false;
    const target = {
      lat: Number(location.latitude),
      lng: Number(location.longitude),
    };

    if (!Number.isFinite(target.lat) || !Number.isFinite(target.lng)) {
      return undefined;
    }

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapElementRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapElementRef.current, {
            center: target,
            zoom: 16,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            gestureHandling: "greedy",
          });

          markerRef.current = new maps.Marker({
            map: mapRef.current,
            position: target,
            title: "Volunteer live location",
            label: {
              text: "🚚",
              fontSize: "30px",
            },
            zIndex: 1000,
          });

          markerPositionRef.current = target;
          mapRef.current.panTo(target);
          return;
        }

        if (!markerRef.current) return;

        const start = markerPositionRef.current || target;
        const startedAt = performance.now();
        const duration = 900;

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        const animate = (currentTime) => {
          const progress = Math.min((currentTime - startedAt) / duration, 1);
          const eased = progress * (2 - progress);
          const nextPosition = {
            lat: start.lat + (target.lat - start.lat) * eased,
            lng: start.lng + (target.lng - start.lng) * eased,
          };

          markerRef.current.setPosition(nextPosition);
          mapRef.current.panTo(nextPosition);
          markerPositionRef.current = nextPosition;

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      })
      .catch((error) => {
        if (!cancelled) setMapError(error.message);
      });

    return () => {
      cancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [location]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      markerRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const mapLink = location
    ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : "";

  return (
    <DashboardLayout navItems={getNavItems(userInfo?.role)}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Delivery tracking
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Live volunteer location
          </h1>
          <p className="mt-2 text-gray-500">
            This page updates automatically while the volunteer is on the way.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Connection
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    connected ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                />
                <span className="font-bold text-gray-800">
                  {connected ? "Connected to live updates" : "Reconnecting..."}
                </span>
              </div>
            </div>

            {location && (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                Updated {new Date(location.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {location ? (
            <div className="pt-6">
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50">
                <div
                  ref={mapElementRef}
                  className="h-[360px] w-full bg-blue-100"
                />
              </div>

              {mapError && (
                <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Map could not load: {mapError}
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg shadow-blue-200">
                  🚚
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-blue-950">
                  Volunteer is sharing location
                </h2>
                <p className="mt-2 font-mono text-sm text-blue-800">
                  {Number(location.latitude).toFixed(6)},{" "}
                  {Number(location.longitude).toFixed(6)}
                </p>
                {location.accuracy ? (
                  <p className="mt-1 text-xs text-blue-700">
                    GPS accuracy: approximately {location.accuracy}m
                  </p>
                ) : null}
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Open location in Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                📍
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Waiting for the volunteer
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Location will appear here after the volunteer confirms the donor
                OTP and allows location sharing.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TrackDelivery;
