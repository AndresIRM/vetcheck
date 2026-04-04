"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import styles from "../owner.module.css";

type VetMapItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
};

type Props = {
  vets: VetMapItem[];
  selectedVetId: string | null;
  onSelectVet: (vet: VetMapItem) => void;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
}

function FocusSelectedVet({
  selectedVet,
}: {
  selectedVet: VetMapItem | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedVet &&
      typeof selectedVet.lat === "number" &&
      typeof selectedVet.lng === "number"
    ) {
      map.setView([selectedVet.lat, selectedVet.lng], 14, {
        animate: true,
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  }, [map, selectedVet]);

  return null;
}

export default function VetMap({
  vets,
  selectedVetId,
  onSelectVet,
}: Props) {
  const vetsWithCoords = vets.filter(
    (vet) => typeof vet.lat === "number" && typeof vet.lng === "number"
  );

  const selectedVet =
    vetsWithCoords.find((vet) => vet.id === selectedVetId) ?? null;

  const center: [number, number] =
    selectedVet && typeof selectedVet.lat === "number" && typeof selectedVet.lng === "number"
      ? [selectedVet.lat, selectedVet.lng]
      : vetsWithCoords.length > 0
      ? [vetsWithCoords[0].lat as number, vetsWithCoords[0].lng as number]
      : [19.4326, -99.1332];

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className={styles.mapContainer}
      >
        <FixMapSize />
        <FocusSelectedVet selectedVet={selectedVet} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vetsWithCoords.map((vet) => {
          const fullName =
            [vet.firstName, vet.lastName].filter(Boolean).join(" ").trim() ||
            vet.email;

          return (
            <Marker
              key={vet.id}
              position={[vet.lat as number, vet.lng as number]}
            >
              <Popup>
                <div className={styles.mapPopup}>
                  <strong>{fullName}</strong>
                  <p>{vet.email}</p>
                  {vet.phone ? <p>{vet.phone}</p> : null}

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => onSelectVet(vet)}
                  >
                    {selectedVetId === vet.id
                      ? "Seleccionado"
                      : "Elegir veterinario"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}