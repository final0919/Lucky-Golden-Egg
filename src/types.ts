export type PrizeTier = 'grand' | 'second' | 'third' | 'encouragement';

export interface GoldenEgg {
  id: string;
  tierId: PrizeTier;
  prizeName: string;
  itemName: string;
  gradient: string;
  isSmashed: boolean;
}

export interface Prize {
  id: PrizeTier;
  name: string;        // Name of the tier (e.g., 一等奖)
  itemName: string;    // Name of the specific item (e.g., iPhone 15)
  color: string;       // Primary color hex or Tailwind name
  gradient: string;    // Capsule CSS gradient classes
  total: number;       // Initial total stock
  remaining: number;   // Current remaining stock
  probability: number; // Probability weight
  accentColor: string; // Dynamic glow color
}

export interface WinningRecord {
  id: string;
  timestamp: string;
  tierId: PrizeTier;
  tierName: string;
  prizeName: string;
  capsuleColor: string;
  capsuleGradient: string;
}

export interface Capsule {
  id: string;
  x: number;          // Horizontal percentage inside cabin (15% - 85%)
  y: number;          // Vertical percentage stacked from pile (70% - 85%)
  color: string;      // Capsule outer base color
  gradient: string;   // Capsule gradient
  angle: number;      // Decorative tilt angle (-45 to 45 deg)
  size: number;       // Visual diameter (px)
  isGrabbed: boolean; // Is it currently held by the claw?
}

export type GameStatus = 
  | 'idle'            // Waiting for user input
  | 'moving-left'     // Trolley shifting left
  | 'moving-right'    // Trolley shifting right
  | 'descending'      // Cable extending downwards
  | 'grabbing'        // Claw fingers clasping
  | 'ascending'       // Cable retracting upwards
  | 'retracting'      // Trolley returning to exit chute
  | 'dropping'        // Claw opening, capsule falling
  | 'rewarding'       // Capsule rolling down and popping up reward modal
  | 'resetting';      // Claw moving back to home position
