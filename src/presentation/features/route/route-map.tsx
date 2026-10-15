import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { GeoPoint } from '@/core/types/geo.types';
import type { RouteLeg, RoutePlan } from '@/core/types/route.types';
import { decodePolyline } from '@/shared/utils/polyline';
import { googleMapStyle, useAppColorScheme, useThemeColors } from '@/theme';
import { VISIT_TYPE_VISUALS } from '../visits/visit-visuals';

const FIT_PADDING = { top: 56, right: 48, bottom: 56, left: 48 };
/** Custom marker views are snapshotted: track changes only until they have rendered. */
const MARKER_RENDER_MS = 800;
const INITIAL_DELTA = 0.05;

export interface RouteMapItem {
  visit: VisitEntity;
  leg: RouteLeg;
  position: number;
}

export interface RouteMapProps {
  plan: RoutePlan;
  items: readonly RouteMapItem[];
  onSelect?: (visit: VisitEntity) => void;
}

/**
 * Route of the day: numbered stops (colored by visit type) and the drive to follow. Google
 * Maps on Android (free mobile SDK), Apple Maps on iPhone. An estimated route is drawn as a
 * dashed straight line between stops.
 */
export function RouteMap({ plan, items, onSelect }: RouteMapProps) {
  const colors = useThemeColors();
  const scheme = useAppColorScheme();
  const mapRef = useRef<MapView>(null);
  const [isReady, setIsReady] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const path = useMemo<GeoPoint[]>(
    () =>
      plan.encodedPolyline
        ? decodePolyline(plan.encodedPolyline)
        : [plan.origin, ...plan.legs.map((leg) => leg.point)],
    [plan],
  );

  const markersKey = items.map((item) => `${item.visit.id}:${item.position}`).join('|');
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), MARKER_RENDER_MS);
    return () => clearTimeout(timer);
  }, [markersKey, scheme]);

  const fit = useCallback(() => {
    const coordinates = [plan.origin, ...items.map((item) => item.leg.point)];
    if (coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(coordinates, { edgePadding: FIT_PADDING, animated: true });
    }
  }, [plan.origin, items]);

  useEffect(() => {
    if (isReady) fit();
  }, [isReady, fit]);

  return (
    <MapView
      ref={mapRef}
      testID="route-map"
      style={{ flex: 1 }}
      initialRegion={{
        latitude: plan.origin.latitude,
        longitude: plan.origin.longitude,
        latitudeDelta: INITIAL_DELTA,
        longitudeDelta: INITIAL_DELTA,
      }}
      onMapReady={() => setIsReady(true)}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
      userInterfaceStyle={scheme}
      customMapStyle={Platform.OS === 'android' ? googleMapStyle(scheme) : undefined}
    >
      {path.length > 1 ? (
        <Polyline
          coordinates={path}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineDashPattern={plan.encodedPolyline ? undefined : [10, 8]}
        />
      ) : null}

      {items.map(({ visit, leg, position }) => {
        const typeColor = colors[VISIT_TYPE_VISUALS[visit.type].token];
        return (
          <Marker
            key={visit.id}
            identifier={visit.id}
            coordinate={leg.point}
            title={`${position}. ${visit.customer?.tradeName ?? ''}`}
            onCalloutPress={() => onSelect?.(visit)}
            tracksViewChanges={tracksViewChanges}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-full border-2"
              style={{ backgroundColor: typeColor, borderColor: colors.card }}
            >
              <Text className="text-sm font-bold" style={{ color: colors.primaryForeground }}>
                {position}
              </Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}
