/**
 * Attendance calculation utilities
 * Manages state transitions and attendance percentage calculations
 */

export type AttendanceState = "present" | "absent" | "leave";

export interface TimelineNode {
  id: string;
  date: Date;
  dayOfWeek: string;
  state: AttendanceState;
  isToday: boolean;
}

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  canMiss: number;
  neededFor75: number;
}

/**
 * Get next state in the cycle: Present → Absent → Leave → Present
 */
export const getNextState = (currentState: AttendanceState): AttendanceState => {
  const cycle: AttendanceState[] = ["present", "absent", "leave"];
  const currentIndex = cycle.indexOf(currentState);
  return cycle[(currentIndex + 1) % cycle.length];
};

/**
 * Generate timeline nodes for future days
 * Automatically includes timetable days
 */
export interface GenerateTimelineOptions {
  startDate?: Date;
  numDays?: number;
  includedDays?: string[]; // e.g., ["Monday", "Tuesday", ...]
  includeSundays?: boolean;
}

export const generateTimelineNodes = (
  options: GenerateTimelineOptions = {}
): TimelineNode[] => {
  const {
    startDate = new Date(),
    numDays = 30,
    includedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    includeSundays = false,
  } = options;

  const dayMap = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  const nodes: TimelineNode[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = dayMap[date.getDay() as keyof typeof dayMap];
    const isDayIncluded = includedDays.includes(dayOfWeek);
    const isSunday = date.getDay() === 0;

    // Skip if not in included days or if it's Sunday and we're excluding Sundays
    if (!isDayIncluded || (isSunday && !includeSundays)) {
      continue;
    }

    nodes.push({
      id: date.toISOString(),
      date: new Date(date),
      dayOfWeek,
      state: "present", // Default state
      isToday: date.getTime() === today.getTime(),
    });
  }

  return nodes;
};

/**
 * Calculate attendance statistics based on nodes
 */
export const calculateAttendanceStats = (
  currentTotal: number,
  currentAttended: number,
  nodes: TimelineNode[]
): AttendanceStats => {
  let totalClasses = currentTotal;
  let attendedClasses = currentAttended;

  // Count predictions impact
  for (const node of nodes) {
    if (node.state === "present") {
      totalClasses += 1;
      attendedClasses += 1;
    } else if (node.state === "absent") {
      totalClasses += 1;
      // attended count stays the same
    }
    // "leave" state doesn't affect totals
  }

  const percentage =
    totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

  // Calculate: How many classes can be missed while maintaining 75%?
  // (attended) / (total + x) = 0.75
  // attended = 0.75 * (total + x)
  // attended = 0.75 * total + 0.75 * x
  // attended - 0.75 * total = 0.75 * x
  // x = (attended - 0.75 * total) / 0.75
  const canMiss = Math.max(
    0,
    Math.floor((attendedClasses - 0.75 * totalClasses) / 0.75)
  );

  // Calculate: How many classes are needed to reach 75%?
  // (attended + x) / (total + x) = 0.75
  // attended + x = 0.75 * total + 0.75 * x
  // attended + x - 0.75 * x = 0.75 * total
  // attended + 0.25 * x = 0.75 * total
  // 0.25 * x = 0.75 * total - attended
  // x = (0.75 * total - attended) / 0.25
  const neededFor75 = Math.max(
    0,
    Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25)
  );

  return {
    totalClasses,
    attendedClasses,
    percentage,
    canMiss,
    neededFor75,
  };
};

/**
 * Get color scheme for state
 */
export const getStateColors = (state: AttendanceState) => {
  const colors = {
    present: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      badge: "bg-emerald-100",
      glow: "shadow-emerald-500/30",
    },
    absent: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-200",
      badge: "bg-rose-100",
      glow: "shadow-rose-500/30",
    },
    leave: {
      bg: "bg-gray-50",
      text: "text-gray-500",
      border: "border-gray-200",
      badge: "bg-gray-100",
      glow: "shadow-gray-400/20",
    },
  };
  return colors[state];
};

/**
 * Get icon for state
 */
export const getStateIcon = (state: AttendanceState): string => {
  const icons = {
    present: "✓",
    absent: "✕",
    leave: "◯",
  };
  return icons[state];
};

/**
 * Format date for display
 */
export const formatTimelineDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });
};

/**
 * Format day of week short
 */
export const formatDayShort = (dayOfWeek: string): string => {
  return dayOfWeek.substring(0, 3);
};
