import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Dagat Ta Bai Signature Motif:
 * An abstract geometry uniting the horizon line, gentle coastal swell, and navigational beacon.
 * Clean, minimal, handcrafted stroke weight.
 */
export function DtbMotif({ size = 24, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Horizon base line */}
      <path d="M2 17h20" />
      {/* Gentle coastal swell */}
      <path d="M4 14c3-2 6-2 9 0s6 2 7-1" />
      {/* Beacon / navigational sun node */}
      <circle cx="12" cy="7" r="2.5" />
      <path d="M12 2v1.5M7 7H5.5M18.5 7H17" />
    </svg>
  );
}

/**
 * Coastal Compass:
 * Navigational dial with nautical degree marks and clean maritime geometry.
 */
export function CoastalCompass({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      {/* Internal diamond needle */}
      <polygon points="12,7 14.5,12 12,17 9.5,12" strokeWidth={strokeWidth} fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}

/**
 * Shoreline Marker (Coastal Pin):
 * Teardrop pin referencing coastal shoreline grounding without generic pin cliché.
 */
export function ShorelineMarker({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 21c-4-4.5-7-8.5-7-12a7 7 0 1 1 14 0c0 3.5-3 7.5-7 12z" />
      <path d="M9.5 9c1.5-1 3.5-1 5 0" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Coastal Tides & Swell:
 * Harmonic wave curve indicating tidal movement and sea depth.
 */
export function CoastalTides({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 8c3-2 6-2 9 0s6 2 9 0" />
      <path d="M3 13c3-2 6-2 9 0s6 2 9 0" />
      <path d="M3 18c3-2 6-2 9 0s6 2 9 0" />
    </svg>
  );
}

/**
 * Coastal Horizon Sun:
 * Coastal sun rising over the waterline, without cartoon rays.
 */
export function CoastalSun({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 18h18" />
      <path d="M6 18a6 6 0 0 1 12 0" />
      <path d="M12 5V2.5M6.5 8 4.8 6.3M17.5 8l1.7-1.7M2 13h2M20 13h2" />
    </svg>
  );
}

/**
 * Sea Route / Geodesic Path:
 * Point-to-point coastal course line connecting anchor waypoints.
 */
export function SeaRoute({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <path d="M7.5 17c3-1 4-6 8-8l1-.7" strokeDasharray="3 3" />
    </svg>
  );
}

/**
 * 360 Panorama Lens:
 * Spherical horizon viewer mark.
 */
export function PanoramaView({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.5 8.5C5 5.5 8.2 4 12 4s7 1.5 9.5 4.5" />
      <path d="M2.5 15.5C5 18.5 8.2 20 12 20s7-1.5 9.5-4.5" />
      <ellipse cx="12" cy="12" rx="4" ry="7" />
    </svg>
  );
}

/**
 * Verified Sanctuary & Local Trust:
 * Maritime shield with clean inner anchor curve.
 */
export function VerifiedSanctuary({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3 4 6.5v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5v-6L12 3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/**
 * Beach Cottage / Native Shelter:
 * Minimalist native bamboo cottage profile with stilted deck and thatch roof.
 */
export function BeachCottage({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Roof */}
      <path d="M3 11 12 4l9 7" />
      {/* Walls */}
      <path d="M5 11v6h14v-6" />
      {/* Stilt posts */}
      <path d="M6 17v4M12 17v4M18 17v4" />
      {/* Native doorway */}
      <path d="M10 17v-3h4v3" />
    </svg>
  );
}

/**
 * Snorkel & Marine Life:
 * Abstract sea turtle shell / marine sanctuary geometry.
 */
export function MarineSanctuary({ size = 20, className = '', strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <ellipse cx="12" cy="12.5" rx="5.5" ry="7" />
      <path d="M12 5.5V3M7.5 7.5 5 6M16.5 7.5 19 6M7 16l-3 2M17 16l3 2" />
      <path d="M12 8.5v8M9 12.5h6" />
    </svg>
  );
}
