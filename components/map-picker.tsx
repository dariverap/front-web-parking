'use client'

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface MapPickerProps {
  lat: string;
  lng: string;
  onLocationChange: (lat: string, lng: string) => void;
}

export function MapPicker({ lat, lng, onLocationChange }: MapPickerProps) {
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    updateMapUrl(lat, lng);
  }, [lat, lng]);

  const updateMapUrl = (lat: string, lng: string) => {
    if (lat && lng) {
      const url = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed&markers=${lat},${lng}`;
      setMapUrl(url);
    } else {
      // Coordenadas por defecto (UTP)
      const defaultUrl = 'https://maps.google.com/maps?q=-11.985608,-77.072030&z=16&output=embed&markers=-11.985608,-77.072030';
      setMapUrl(defaultUrl);
    }
  };

  const handleUseMyLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLat = latitude.toFixed(6);
          const newLng = longitude.toFixed(6);
          onLocationChange(newLat, newLng);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="lat">Latitud</Label>
          <Input
            id="lat"
            value={lat}
            onChange={(e) => {
              const newLat = e.target.value.replace(/[^0-9.-]/g, '');
              onLocationChange(newLat, lng);
            }}
            placeholder="Ej: -11.985608"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lng">Longitud</Label>
          <Input
            id="lng"
            value={lng}
            onChange={(e) => {
              const newLng = e.target.value.replace(/[^0-9.-]/g, '');
              onLocationChange(lat, newLng);
            }}
            placeholder="Ej: -77.072030"
          />
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="h-64 w-full relative">
          <iframe
            title="Ubicación del parking"
            className="w-full h-full"
            src={mapUrl}
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="px-3 py-2 text-xs text-muted-foreground flex items-center justify-between bg-gray-50">
          <span>Actualiza las coordenadas manualmente o usa tu ubicación</span>
          <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation}>
            <MapPin className="mr-2 h-4 w-4" />
            Usar mi ubicación
          </Button>
        </div>
      </div>
    </div>
  );
}
