"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
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

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function VetMap({ vets, selectedVetId, onSelectVet }: Props) {
  const vetsWithCoords = vets.filter(
    (vet) => typeof vet.lat === "number" && typeof vet.lng === "number"
  );

  const center =
    vetsWithCoords.length > 0
      ? [vetsWithCoords[0].lat as number, vetsWithCoords[0].lng as number]
      : [19.4326, -99.1332];

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={center as [number, number]}
        zoom={12}
        scrollWheelZoom={true}
        className={styles.mapContainer}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vetsWithCoords.map((vet) => {
          const fullName =
            [vet.firstName, vet.lastName].filter(Boolean).join(" ").trim() ||
            vet.email;

          return (
            <Marker
              key={vet.id}
              position={[vet.lat as number, vet.lng as number]}
              icon={icon}
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
                    {selectedVetId === vet.id ? "Seleccionado" : "Elegir veterinario"}
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