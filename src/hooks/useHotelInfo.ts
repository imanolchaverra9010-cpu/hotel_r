import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";

export interface HotelInfo {
  phone: string | null;
  email: string | null;
  address: string | null;
  whatsapp: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  opening_hours: string | null;
}

const defaults: HotelInfo = {
  phone: "310 437 4492",
  email: "hotelroble@hotmail.com",
  address: "Hotel Los Robles, Cl. 28 #314 a 3-174, Quibdó, Chocó",
  whatsapp: "+573104374492",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  opening_hours: "24 horas, 7 días a la semana",
};

export function useHotelInfo() {
  const [info, setInfo] = useState<HotelInfo>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/hotel-info`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setInfo({
            phone: data.phone ?? defaults.phone,
            email: data.email ?? defaults.email,
            address: data.address ?? defaults.address,
            whatsapp: data.whatsapp ?? defaults.whatsapp,
            facebook_url: data.facebook_url ?? defaults.facebook_url,
            instagram_url: data.instagram_url ?? defaults.instagram_url,
            twitter_url: data.twitter_url ?? defaults.twitter_url,
            opening_hours: data.opening_hours ?? defaults.opening_hours,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { hotelInfo: info, loading };
}
