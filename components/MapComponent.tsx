import React, { useMemo } from 'react';
import { Bin, User } from '../types';
import { SF_CENTER } from '../constants';

interface MapComponentProps {
  bins: Bin[];
  collectors: User[]; // New: List of collector users to display
  currentUserLocation?: { lat: number; lng: number } | null; // New: Current user's real-time location
  height?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ bins, collectors, currentUserLocation, height = 'h-[40vh]' }) => {
  // Generate markers string for Google Maps URL
  const markers = useMemo(() => {
    const allMarkers: string[] = [];

    // Bin markers
    bins.forEach(bin => {
      const color = bin.fillLevel >= 80 ? 'red' : bin.fillLevel >= 50 ? 'yellow' : 'green';
      const label = bin.serialNumber.replace('SN-', '');
      allMarkers.push(`markers=color:${color}%7Clabel:${label}%7C${bin.location.lat},${bin.location.lng}`);
    });

    // Collector markers
    collectors.forEach(collector => {
      if (collector.currentLocation) {
        let collectorColor = 'blue'; // Default for 'idle'
        if (collector.status === 'enroute') {
          collectorColor = 'purple';
        } else if (collector.status === 'collecting') {
          collectorColor = 'orange';
        }
        allMarkers.push(`markers=color:${collectorColor}%7Clabel:C%7C${collector.currentLocation.lat},${collector.currentLocation.lng}`);
      }
    });

    // Current user's location marker (purple with 'ME' label)
    if (currentUserLocation) {
      allMarkers.push(`markers=color:purple%7Clabel:ME%7C${currentUserLocation.lat},${currentUserLocation.lng}`);
    }

    return allMarkers.join('&');
  }, [bins, collectors, currentUserLocation]);

  // Determine the map center dynamically
  const mapCenter = useMemo(() => {
    if (currentUserLocation) {
      return `${currentUserLocation.lat},${currentUserLocation.lng}`;
    }
    if (collectors.length > 0 && collectors[0].currentLocation) {
      return `${collectors[0].currentLocation.lat},${collectors[0].currentLocation.lng}`;
    }
    return `${SF_CENTER.lat},${SF_CENTER.lng}`;
  }, [currentUserLocation, collectors]);


  // Construct Google Maps embed URL
  const mapUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${mapCenter}&z=12&ie=UTF8&iwloc=&output=embed&${markers}`;
  }, [mapCenter, markers]);

  return (
    <div className={`w-full rounded-lg shadow-md overflow-hidden ${height}`}>
      <iframe
        width="100%"
        height="100%"
        loading="lazy"
        allowFullScreen={true}
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        aria-label="Map showing waste bin and collector locations"
        title="Waste Bin and Collector Locations Map"
      ></iframe>
    </div>
  );
};

export default MapComponent;