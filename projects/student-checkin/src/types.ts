export type StudentStatus = 'pending' | 'approved' | 'rejected';

export interface Student {
  id: number;
  line_user_id: string;
  student_code: string;
  full_name: string;
  class_room: string;
  phone: string;
  guardian_phone: string;
  status: StudentStatus;
  review_note: string;
  created_at: string;
}

export interface Zone {
  id: number;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  active: number; // 0 | 1
  created_at: string;
}

export type CheckinStatus = 'in_range' | 'out_of_range';

export interface Checkin {
  id: number;
  student_id: number;
  zone_id: number | null;
  lat: number;
  lng: number;
  distance_m: number;
  status: CheckinStatus;
  checked_at: string;
}

export interface Teacher {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
}

// payload ที่ฝังใน token
export interface TokenPayload {
  role: 'student' | 'teacher';
  sub: string; // student.line_user_id หรือ teacher.username
  id?: number; // db id ถ้ามี
  exp: number; // epoch seconds
}

// โปรไฟล์ที่ได้จาก LINE (จริงหรือ mock)
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}
